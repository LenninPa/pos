<?php
session_start();
include '../config/conn.php';
header('Content-Type: application/json');
if (isset($_POST['code_bar'])) {
    $code = trim($_POST['code_bar']);
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE code = :code LIMIT 1");
        $stmt->bindParam(':code', $code);
        $stmt->execute();
        
        if ($product = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // COMPROBACIÓN DE INVENTARIO
            if ($product['inventory_use'] == 1 && $product['stock'] <= 0) {
                
                // Separar el mensaje de error y el script del modal
                echo json_encode([
                    'success' => false, 
                    'inventory_empty' => true,
                    'message' => 'Inventario agotado', // Mensaje simple para evitar alertas
                    'product_name' => $product['product'],
                    'modal_script' => true // Indica al frontend que debe mostrar un modal
                ]);
            } else {
                // BUSCAR EL ID del departamento por nombre
                $departmentName = $product['department'];
                $departmentId = null;
                
                if (!empty($departmentName)) {
                    $deptStmt = $pdo->prepare("SELECT Id FROM departments WHERE name_dep = :name LIMIT 1");
                    $deptStmt->bindParam(':name', $departmentName);
                    $deptStmt->execute();
                    $dept = $deptStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($dept) {
                        $departmentId = $dept['Id'];
                    }
                }
                
                // AGREGAR department_id como el ID numérico encontrado
                $product['department_id'] = $departmentId;
                
                // En caso contrario, devolver éxito y los datos del producto
                echo json_encode(['success' => true, 'product' => $product]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error de base de datos: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Código de producto no proporcionado']);
}
?>