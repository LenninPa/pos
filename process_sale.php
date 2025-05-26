<?php
/**
 * process_sale.php - Procesamiento de ventas
 * Versión robusta con manejo completo de errores
 */

session_start();
include '../config/conn.php';

// IMPORTANTE: Establecer zona horaria para El Salvador
date_default_timezone_set('America/El_Salvador');

header('Content-Type: application/json');

// Función de logging para debug
function logDebug($message, $data = null) {
    $logMessage = "[" . date('Y-m-d H:i:s') . "] " . $message;
    if ($data !== null) {
        $logMessage .= ": " . print_r($data, true);
    }
    error_log($logMessage);
}

// Log del inicio del proceso
logDebug("Iniciando proceso de venta", $_POST);

try {
    // Verificar si se recibieron datos básicos
    if (!isset($_POST['products']) || !isset($_POST['total'])) {
        throw new Exception('Datos insuficientes: falta products o total');
    }

    // Decodificar y validar productos
    $products = json_decode($_POST['products'], true);
    if ($products === null) {
        throw new Exception('Error al decodificar JSON de productos: ' . json_last_error_msg());
    }

    // Validar y obtener datos adicionales
    $total = floatval($_POST['total']);
    $subtotal = isset($_POST['subtotal']) ? floatval($_POST['subtotal']) : $total;
    $ticketName = isset($_POST['ticket_name']) ? trim($_POST['ticket_name']) : "Cliente común";

    // Validar que hay productos
    if (empty($products)) {
        throw new Exception('No hay productos en la venta');
    }

    // Validar que el total sea positivo
    if ($total <= 0) {
        throw new Exception('El total de la venta debe ser mayor a cero');
    }

    logDebug("Datos validados", [
        'productos' => count($products),
        'total' => $total,
        'subtotal' => $subtotal,
        'ticket_name' => $ticketName
    ]);

    // Iniciar transacción
    $pdo->beginTransaction();
    
    // Preparar fecha actual - CON ZONA HORARIA DE EL SALVADOR
    $date = date('Y-m-d H:i:s');
    
    // DEBUG: Verificar fecha que se va a guardar
    logDebug("Fecha/hora que se guardará", [
        'fecha_completa' => $date,
        'solo_fecha' => date('Y-m-d'),
        'zona_horaria' => date_default_timezone_get()
    ]);
    
    // Insertar registro principal de venta
    $stmt = $pdo->prepare("INSERT INTO sales (ticket_name, date, sub_total, total) VALUES (?, ?, ?, ?)");
    $executeResult = $stmt->execute([$ticketName, $date, $subtotal, $total]);
    
    if (!$executeResult) {
        throw new Exception('Error al insertar en tabla sales: ' . implode(', ', $stmt->errorInfo()));
    }
    
    // Obtener el ID autogenerado
    $saleId = $pdo->lastInsertId();
    
    if ($saleId <= 0) {
        throw new Exception('No se pudo obtener el ID de la venta insertada');
    }
    
    logDebug("Venta insertada con ID", $saleId);
    
    // Actualizar el ticket_number con el mismo ID de la venta
    $stmt = $pdo->prepare("UPDATE sales SET ticket_number = ? WHERE id = ?");
    $updateResult = $stmt->execute([$saleId, $saleId]);
    
    if (!$updateResult) {
        throw new Exception('Error al actualizar ticket_number: ' . implode(', ', $stmt->errorInfo()));
    }
    
    // Preparar la consulta para insertar detalles
    $insertDetailStmt = $pdo->prepare("
        INSERT INTO sale_details (
            sale_id, 
            product_id, 
            department_id, 
            code, 
            name, 
            price, 
            discount, 
            quantity, 
            subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    // Preparar consulta para buscar product_id
    $findProductStmt = $pdo->prepare("SELECT id FROM products WHERE code = ? LIMIT 1");
    
    // Preparar consulta para actualizar stock
    $updateStockStmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE code = ? AND stock >= ?");
    
    // Procesar cada producto
    $processedProducts = 0;
    foreach ($products as $index => $product) {
        try {
            // Validar datos mínimos del producto
            if (!isset($product['code']) || empty(trim($product['code']))) {
                throw new Exception("Producto en índice {$index}: código faltante o vacío");
            }
            
            if (!isset($product['quantity']) || intval($product['quantity']) <= 0) {
                throw new Exception("Producto {$product['code']}: cantidad inválida");
            }
            
            if (!isset($product['price']) || floatval($product['price']) < 0) {
                throw new Exception("Producto {$product['code']}: precio inválido");
            }
            
            // Extraer y limpiar datos
            $code = trim($product['code']);
            $name = trim(isset($product['name']) ? $product['name'] : (isset($product['product']) ? $product['product'] : 'Producto sin nombre'));
            $price = floatval($product['price']);
            $quantity = intval($product['quantity']);
            $discount = floatval($product['discount'] ?? 0);
            $departmentId = isset($product['department_id']) && !empty($product['department_id']) ? $product['department_id'] : null;
            
            // Calcular subtotal del producto
            $productSubtotal = $price * $quantity;
            
            // Buscar ID del producto en la base de datos
            $findProductStmt->execute([$code]);
            $productData = $findProductStmt->fetch(PDO::FETCH_ASSOC);
            $productId = $productData ? $productData['id'] : null;
            
            logDebug("Procesando producto", [
                'codigo' => $code,
                'nombre' => $name,
                'precio' => $price,
                'cantidad' => $quantity,
                'descuento' => $discount,
                'departamento_id' => $departmentId,
                'product_id' => $productId
            ]);
            
            // Insertar detalle de venta
            $detailResult = $insertDetailStmt->execute([
                $saleId,
                $productId,
                $departmentId,
                $code,
                $name,
                $price,
                $discount,
                $quantity,
                $productSubtotal
            ]);
            
            if (!$detailResult) {
                throw new Exception("Error al insertar detalle para producto {$code}: " . implode(', ', $insertDetailStmt->errorInfo()));
            }
            
            // Actualizar stock solo si NO es producto a granel
            if (!preg_match('/^BULK/i', $code)) {
                // Verificar que hay stock suficiente antes de actualizar
                $checkStockStmt = $pdo->prepare("SELECT stock FROM products WHERE code = ? LIMIT 1");
                $checkStockStmt->execute([$code]);
                $stockData = $checkStockStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($stockData) {
                    $currentStock = intval($stockData['stock']);
                    
                    if ($currentStock >= $quantity) {
                        // Hay stock suficiente, actualizar
                        $stockUpdateResult = $updateStockStmt->execute([$quantity, $code, $quantity]);
                        
                        if (!$stockUpdateResult) {
                            logDebug("Advertencia: No se pudo actualizar stock para producto {$code}");
                        } else {
                            logDebug("Stock actualizado para {$code}: {$currentStock} -> " . ($currentStock - $quantity));
                        }
                    } else {
                        // Stock insuficiente - registrar advertencia pero continuar
                        logDebug("Advertencia: Stock insuficiente para {$code}. Disponible: {$currentStock}, Solicitado: {$quantity}");
                    }
                } else {
                    logDebug("Producto {$code} no encontrado en tabla products para actualizar stock");
                }
            } else {
                logDebug("Producto a granel {$code} - no se actualiza stock");
            }
            
            $processedProducts++;
            
        } catch (Exception $productError) {
            // Log del error específico del producto pero continúa con los demás
            logDebug("Error procesando producto individual", $productError->getMessage());
            throw new Exception("Error en producto {$index}: " . $productError->getMessage());
        }
    }
    
    // Verificar que se procesó al menos un producto
    if ($processedProducts === 0) {
        throw new Exception('No se pudo procesar ningún producto');
    }
    
    // Confirmar transacción
    $pdo->commit();
    
    logDebug("Venta procesada exitosamente", [
        'sale_id' => $saleId,
        'productos_procesados' => $processedProducts,
        'total' => $total
    ]);
    
    // Respuesta exitosa
    $response = [
        'status' => 'success',
        'message' => 'Venta registrada exitosamente',
        'ticket_number' => $saleId,
        'sale_id' => $saleId,
        'subtotal' => $subtotal,
        'total' => $total,
        'products_processed' => $processedProducts,
        'date' => $date
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
        logDebug("Transacción revertida debido a error");
    }
    
    $errorMessage = $e->getMessage();
    logDebug("Error en proceso de venta", $errorMessage);
    
    // Respuesta de error
    $response = [
        'status' => 'error',
        'message' => $errorMessage,
        'details' => 'Error en proceso de venta. Por favor, contacte al administrador del sistema.',
        'error_code' => 'SALE_PROCESS_ERROR'
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Manejar errores específicos de base de datos
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
        logDebug("Transacción revertida debido a error de BD");
    }
    
    $dbError = "Error de base de datos: " . $e->getMessage();
    logDebug("Error PDO", $dbError);
    
    $response = [
        'status' => 'error',
        'message' => 'Error de base de datos',
        'details' => 'Error interno del servidor. Por favor, contacte al administrador.',
        'error_code' => 'DATABASE_ERROR'
    ];
    
    echo json_encode($response);
    
} catch (Throwable $e) {
    // Capturar cualquier otro tipo de error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
        logDebug("Transacción revertida debido a error fatal");
    }
    
    $fatalError = "Error fatal: " . $e->getMessage();
    logDebug("Error fatal", $fatalError);
    
    $response = [
        'status' => 'error',
        'message' => 'Error interno del sistema',
        'details' => 'Error crítico del servidor. Por favor, contacte al administrador inmediatamente.',
        'error_code' => 'FATAL_ERROR'
    ];
    
    echo json_encode($response);
}

// Asegurar que no haya output adicional
exit;
?>