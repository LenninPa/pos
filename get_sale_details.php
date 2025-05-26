<?php
// get_sale_details.php - Obtener detalles de una venta específica
session_start();
include '../config/conn.php';

header('Content-Type: application/json');

try {
    // Obtener ID de la venta
    if (!isset($_POST['sale_id']) || !is_numeric($_POST['sale_id'])) {
        throw new Exception('ID de venta inválido');
    }
    
    $sale_id = intval($_POST['sale_id']);
    
    // Consulta para obtener los detalles de la venta
    $query = "
        SELECT 
            id,
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
        ORDER BY id ASC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $details = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'details' => $details,
        'sale_id' => $sale_id
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>