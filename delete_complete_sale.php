<?php
// delete_complete_sale.php - Anular una venta completa (version con debug)
session_start();
include '../config/conn.php';

header('Content-Type: application/json');

// Función de debug
function debugLog($message, $data = null) {
    $logMessage = "[" . date('Y-m-d H:i:s') . "] CANCEL_SALE: " . $message;
    if ($data !== null) {
        $logMessage .= " - Data: " . print_r($data, true);
    }
    error_log($logMessage);
}

try {
    // Debug: Log de datos recibidos
    debugLog("Datos POST recibidos", $_POST);
    
    // Verificar que se recibió el ID de la venta y los comentarios
    if (!isset($_POST['sale_id']) || !is_numeric($_POST['sale_id'])) {
        debugLog("ERROR: ID de venta inválido", $_POST['sale_id'] ?? 'NO RECIBIDO');
        throw new Exception('ID de venta inválido');
    }
    
    $sale_id = intval($_POST['sale_id']);
    $comments = isset($_POST['comments']) ? trim($_POST['comments']) : '';
    $cancelled_by = isset($_POST['cancelled_by']) ? trim($_POST['cancelled_by']) : 'Administrador';
    
    debugLog("Parámetros procesados", [
        'sale_id' => $sale_id,
        'comments_length' => strlen($comments),
        'cancelled_by' => $cancelled_by
    ]);
    
    // Validar que se proporcionen comentarios
    if (empty($comments)) {
        debugLog("ERROR: Comentarios vacíos");
        throw new Exception('Debe proporcionar un motivo para anular la venta');
    }
    
    // Verificar conexión a base de datos
    if (!$pdo) {
        debugLog("ERROR: No hay conexión PDO");
        throw new Exception('Error de conexión a la base de datos');
    }
    
    // Iniciar transacción
    $pdo->beginTransaction();
    debugLog("Transacción iniciada");
    
    // PRIMER DEBUG: Verificar que la venta existe
    $checkSaleQuery = "SELECT COUNT(*) as total FROM sales WHERE id = :sale_id";
    $checkStmt = $pdo->prepare($checkSaleQuery);
    $checkStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $checkStmt->execute();
    $saleExists = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    debugLog("Verificación de existencia de venta", [
        'sale_id_buscado' => $sale_id,
        'existe' => $saleExists['total']
    ]);
    
    if ($saleExists['total'] == 0) {
        // Buscar ventas similares para debug
        $similarQuery = "SELECT id, ticket_number FROM sales ORDER BY id DESC LIMIT 5";
        $similarStmt = $pdo->query($similarQuery);
        $similarSales = $similarStmt->fetchAll(PDO::FETCH_ASSOC);
        
        debugLog("Ventas recientes encontradas", $similarSales);
        
        throw new Exception('Venta no encontrada - ID: ' . $sale_id);
    }
    
    // Obtener información básica de la venta
    $getSaleQuery = "
        SELECT 
            id,
            ticket_number,
            ticket_name,
            date,
            sub_total,
            total
        FROM sales 
        WHERE id = :sale_id
    ";
    
    $getSaleStmt = $pdo->prepare($getSaleQuery);
    $getSaleStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $getSaleStmt->execute();
    
    $saleInfo = $getSaleStmt->fetch(PDO::FETCH_ASSOC);
    
    debugLog("Información de venta obtenida", $saleInfo);
    
    if (!$saleInfo) {
        debugLog("ERROR: No se pudo obtener información de la venta");
        throw new Exception('Error al obtener información de la venta');
    }
    
    // Obtener detalles de los productos por separado
    $getDetailsQuery = "
        SELECT 
            id as detail_id,
            product_id,
            department_id,
            code,
            name,
            price,
            discount,
            quantity,
            subtotal
        FROM sale_details 
        WHERE sale_id = :sale_id
    ";
    
    $getDetailsStmt = $pdo->prepare($getDetailsQuery);
    $getDetailsStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $getDetailsStmt->execute();
    
    $details = $getDetailsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    debugLog("Detalles de venta obtenidos", [
        'cantidad_productos' => count($details),
        'productos' => $details
    ]);
    
    // Contar items manualmente
    $totalItems = count($details);
    
    // Crear el objeto original_data manualmente
    $originalData = [
        'sale_info' => [
            'id' => $saleInfo['id'],
            'ticket_number' => $saleInfo['ticket_number'],
            'ticket_name' => $saleInfo['ticket_name'],
            'date' => $saleInfo['date'],
            'sub_total' => $saleInfo['sub_total'],
            'total' => $saleInfo['total'],
            'total_items' => $totalItems
        ],
        'products' => $details,
        'cancelled_info' => [
            'cancelled_at' => date('Y-m-d H:i:s'),
            'cancelled_by' => $cancelled_by,
            'comments' => $comments
        ]
    ];
    
    debugLog("Datos preparados para insertar en sales_cancelled", [
        'original_sale_id' => $sale_id,
        'ticket_number' => $saleInfo['ticket_number'],
        'total_products' => count($details)
    ]);
    
    // Verificar que la tabla sales_cancelled existe
    $checkTableQuery = "SHOW TABLES LIKE 'sales_cancelled'";
    $checkTableStmt = $pdo->query($checkTableQuery);
    $tableExists = $checkTableStmt->fetch();
    
    if (!$tableExists) {
        debugLog("ERROR: Tabla sales_cancelled no existe");
        throw new Exception('Tabla sales_cancelled no existe en la base de datos');
    }
    
    // Insertar en tabla sales_cancelled
    $insertCancelledQuery = "
        INSERT INTO sales_cancelled (
            original_sale_id,
            ticket_number,
            ticket_name,
            original_total,
            cancelled_by,
            cancelled_at,
            comments,
            original_data
        ) VALUES (
            :original_sale_id,
            :ticket_number,
            :ticket_name,
            :original_total,
            :cancelled_by,
            NOW(),
            :comments,
            :original_data
        )
    ";
    
    $insertCancelledStmt = $pdo->prepare($insertCancelledQuery);
    $insertCancelledStmt->bindParam(':original_sale_id', $sale_id, PDO::PARAM_INT);
    $insertCancelledStmt->bindParam(':ticket_number', $saleInfo['ticket_number'], PDO::PARAM_STR);
    $insertCancelledStmt->bindParam(':ticket_name', $saleInfo['ticket_name'], PDO::PARAM_STR);
    $insertCancelledStmt->bindParam(':original_total', $saleInfo['total']);
    $insertCancelledStmt->bindParam(':cancelled_by', $cancelled_by, PDO::PARAM_STR);
    $insertCancelledStmt->bindParam(':comments', $comments, PDO::PARAM_STR);
    $insertCancelledStmt->bindParam(':original_data', json_encode($originalData), PDO::PARAM_STR);
    
    if (!$insertCancelledStmt->execute()) {
        $errorInfo = $insertCancelledStmt->errorInfo();
        debugLog("ERROR al insertar en sales_cancelled", $errorInfo);
        throw new Exception('Error al registrar la venta anulada: ' . $errorInfo[2]);
    }
    
    debugLog("Venta insertada en sales_cancelled exitosamente");
    
    // Devolver productos al stock (solo productos con inventory_use = 1)
    $stockUpdates = 0;
    foreach ($details as $product) {
        // Verificar que no sea producto a granel
        if (!preg_match('/^BULK/i', $product['code'])) {
            $updateStockQuery = "
                UPDATE products 
                SET stock = stock + :quantity 
                WHERE id = :product_id AND inventory_use = 1
            ";
            $updateStockStmt = $pdo->prepare($updateStockQuery);
            $updateStockStmt->bindParam(':quantity', $product['quantity'], PDO::PARAM_INT);
            $updateStockStmt->bindParam(':product_id', $product['product_id'], PDO::PARAM_INT);
            $updateStockStmt->execute();
            
            $stockUpdates += $updateStockStmt->rowCount();
            debugLog("Stock actualizado para producto", [
                'product_id' => $product['product_id'],
                'code' => $product['code'],
                'quantity_returned' => $product['quantity']
            ]);
        }
    }
    
    debugLog("Total de productos con stock actualizado", $stockUpdates);
    
    // Eliminar detalles de la venta original
    $deleteDetailsQuery = "DELETE FROM sale_details WHERE sale_id = :sale_id";
    $deleteDetailsStmt = $pdo->prepare($deleteDetailsQuery);
    $deleteDetailsStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $deleteDetailsStmt->execute();
    
    $detailsDeleted = $deleteDetailsStmt->rowCount();
    debugLog("Detalles eliminados", $detailsDeleted);
    
    // Eliminar la venta principal
    $deleteSaleQuery = "DELETE FROM sales WHERE id = :sale_id";
    $deleteSaleStmt = $pdo->prepare($deleteSaleQuery);
    $deleteSaleStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $deleteSaleStmt->execute();
    
    $salesDeleted = $deleteSaleStmt->rowCount();
    debugLog("Ventas eliminadas", $salesDeleted);
    
    if ($salesDeleted === 0) {
        debugLog("ERROR: No se pudo eliminar la venta principal");
        throw new Exception('No se pudo eliminar la venta');
    }
    
    // Confirmar transacción
    $pdo->commit();
    debugLog("Transacción confirmada exitosamente");
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Venta anulada exitosamente',
        'sale_info' => [
            'ticket_number' => $saleInfo['ticket_number'],
            'ticket_name' => $saleInfo['ticket_name'],
            'total' => $saleInfo['total'],
            'comments' => $comments
        ],
        'debug_info' => [
            'sale_id' => $sale_id,
            'details_count' => count($details),
            'stock_updates' => $stockUpdates
        ]
    ]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
        debugLog("Transacción revertida");
    }
    
    debugLog("ERROR FINAL", $e->getMessage());
    
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>