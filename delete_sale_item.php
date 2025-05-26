<?php
// delete_sale_item.php - Eliminar un artículo específico de una venta
session_start();
include '../config/conn.php';

header('Content-Type: application/json');

try {
    // Verificar que se recibieron los parámetros necesarios
    if (!isset($_POST['detail_id']) || !is_numeric($_POST['detail_id'])) {
        throw new Exception('ID de detalle inválido');
    }
    
    if (!isset($_POST['sale_id']) || !is_numeric($_POST['sale_id'])) {
        throw new Exception('ID de venta inválido');
    }
    
    $detail_id = intval($_POST['detail_id']);
    $sale_id = intval($_POST['sale_id']);
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    // Primero obtener información del artículo a eliminar
    $getItemQuery = "
        SELECT 
            product_id,
            quantity,
            price,
            subtotal
        FROM sale_details 
        WHERE id = :detail_id AND sale_id = :sale_id
    ";
    
    $getItemStmt = $pdo->prepare($getItemQuery);
    $getItemStmt->bindParam(':detail_id', $detail_id, PDO::PARAM_INT);
    $getItemStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $getItemStmt->execute();
    
    $itemData = $getItemStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$itemData) {
        throw new Exception('Artículo no encontrado');
    }
    
    // Verificar cuántos artículos quedan en la venta
    $countQuery = "SELECT COUNT(*) as total_items FROM sale_details WHERE sale_id = :sale_id";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $countStmt->execute();
    $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($countResult['total_items'] <= 1) {
        // Si es el último artículo, eliminar toda la venta
        $pdo->rollBack();
        echo json_encode([
            'status' => 'error',
            'message' => 'No se puede eliminar el último artículo. Use "Eliminar Venta" para eliminar toda la venta.',
            'last_item' => true
        ]);
        exit;
    }
    
    // Eliminar el artículo específico
    $deleteItemQuery = "DELETE FROM sale_details WHERE id = :detail_id AND sale_id = :sale_id";
    $deleteStmt = $pdo->prepare($deleteItemQuery);
    $deleteStmt->bindParam(':detail_id', $detail_id, PDO::PARAM_INT);
    $deleteStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $deleteStmt->execute();
    
    if ($deleteStmt->rowCount() === 0) {
        throw new Exception('No se pudo eliminar el artículo');
    }
    
    // Actualizar el stock del producto (devolver la cantidad eliminada)
    $updateStockQuery = "
        UPDATE products 
        SET stock = stock + :quantity 
        WHERE id = :product_id AND inventory_use = 1
    ";
    $updateStockStmt = $pdo->prepare($updateStockQuery);
    $updateStockStmt->bindParam(':quantity', $itemData['quantity'], PDO::PARAM_INT);
    $updateStockStmt->bindParam(':product_id', $itemData['product_id'], PDO::PARAM_INT);
    $updateStockStmt->execute();
    
    // Recalcular totales de la venta
    $recalculateQuery = "
        SELECT 
            SUM(price * quantity) as new_sub_total,
            SUM(subtotal) as new_total
        FROM sale_details 
        WHERE sale_id = :sale_id
    ";
    $recalculateStmt = $pdo->prepare($recalculateQuery);
    $recalculateStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $recalculateStmt->execute();
    $totals = $recalculateStmt->fetch(PDO::FETCH_ASSOC);
    
    // Actualizar la tabla sales con los nuevos totales
    $updateSaleQuery = "
        UPDATE sales 
        SET 
            sub_total = :sub_total,
            total = :total
        WHERE id = :sale_id
    ";
    $updateSaleStmt = $pdo->prepare($updateSaleQuery);
    $updateSaleStmt->bindParam(':sub_total', $totals['new_sub_total']);
    $updateSaleStmt->bindParam(':total', $totals['new_total']);
    $updateSaleStmt->bindParam(':sale_id', $sale_id, PDO::PARAM_INT);
    $updateSaleStmt->execute();
    
    // Confirmar transacción
    $pdo->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Artículo eliminado exitosamente',
        'new_totals' => [
            'sub_total' => floatval($totals['new_sub_total']),
            'total' => floatval($totals['new_total'])
        ]
    ]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>