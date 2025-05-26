<?php
// get_sales_history.php - Obtener historial de ventas por fecha (incluyendo canceladas)
session_start();
include '../config/conn.php';

// Establecer zona horaria para El Salvador
date_default_timezone_set('America/El_Salvador');

header('Content-Type: application/json');

try {
    // Obtener fecha del POST o usar fecha actual de El Salvador
    $date = isset($_POST['date']) ? $_POST['date'] : date('Y-m-d');
    
    // Validar formato de fecha
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        throw new Exception('Formato de fecha inválido');
    }
    
    // Debug: Verificar fecha recibida
    error_log("Fecha solicitada: " . $date);
    error_log("Fecha actual del servidor: " . date('Y-m-d H:i:s'));
    
    // Consulta para obtener las ventas activas del día
    $queryActive = "
        SELECT 
            s.id,
            s.ticket_number,
            s.ticket_name,
            s.date,
            s.sub_total,
            s.total,
            COUNT(sd.id) as total_items,
            SUM(sd.quantity) as total_quantity,
            DATE(s.date) as fecha_venta,
            'active' as status
        FROM sales s
        LEFT JOIN sale_details sd ON s.id = sd.sale_id
        WHERE DATE(s.date) = :date
        GROUP BY s.id
    ";
    
    // Consulta para obtener las ventas canceladas del día
    $queryCancelled = "
        SELECT 
            sc.original_sale_id as id,
            sc.ticket_number,
            sc.ticket_name,
            sc.cancelled_at as date,
            0 as sub_total,
            sc.original_total as total,
            0 as total_items,
            0 as total_quantity,
            DATE(sc.cancelled_at) as fecha_venta,
            'cancelled' as status,
            sc.cancelled_by,
            sc.comments,
            sc.original_data
        FROM sales_cancelled sc
        WHERE DATE(sc.cancelled_at) = :date
    ";
    
    // Ejecutar consulta de ventas activas
    $stmtActive = $pdo->prepare($queryActive);
    $stmtActive->bindParam(':date', $date);
    $stmtActive->execute();
    $activeSales = $stmtActive->fetchAll(PDO::FETCH_ASSOC);
    
    // Ejecutar consulta de ventas canceladas
    $stmtCancelled = $pdo->prepare($queryCancelled);
    $stmtCancelled->bindParam(':date', $date);
    $stmtCancelled->execute();
    $cancelledSales = $stmtCancelled->fetchAll(PDO::FETCH_ASSOC);
    
    // Para las ventas canceladas, extraer información de original_data si está disponible
    foreach ($cancelledSales as &$sale) {
        if (!empty($sale['original_data'])) {
            $originalData = json_decode($sale['original_data'], true);
            if (isset($originalData['sale_info'])) {
                $sale['total_items'] = $originalData['sale_info']['total_items'] ?? 0;
                $sale['sub_total'] = $originalData['sale_info']['sub_total'] ?? 0;
                
                // Contar cantidad total de productos
                if (isset($originalData['products'])) {
                    $totalQuantity = 0;
                    foreach ($originalData['products'] as $product) {
                        $totalQuantity += $product['quantity'] ?? 0;
                    }
                    $sale['total_quantity'] = $totalQuantity;
                }
            }
        }
    }
    
    // Combinar ambos arrays
    $allSales = array_merge($activeSales, $cancelledSales);
    
    // Ordenar por fecha descendente
    usort($allSales, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    // Formatear los datos
    foreach ($allSales as &$sale) {
        $sale['total_items'] = $sale['total_items'] ?: 0;
        $sale['total_quantity'] = $sale['total_quantity'] ?: 0;
        
        // Debug: Mostrar información de cada venta
        error_log("Venta - ID: " . $sale['id'] . " - Ticket: " . $sale['ticket_number'] . " - Status: " . $sale['status']);
    }
    
    // Debug adicional
    if (count($allSales) == 0) {
        $debugQuery = "
            SELECT 
                DATE(date) as fecha_venta, 
                COUNT(*) as total_ventas,
                'active' as tipo
            FROM sales 
            WHERE date >= DATE_SUB(NOW(), INTERVAL 2 DAY)
            GROUP BY DATE(date)
            
            UNION ALL
            
            SELECT 
                DATE(cancelled_at) as fecha_venta, 
                COUNT(*) as total_ventas,
                'cancelled' as tipo
            FROM sales_cancelled 
            WHERE cancelled_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)
            GROUP BY DATE(cancelled_at)
            
            ORDER BY fecha_venta DESC
        ";
        $debugStmt = $pdo->query($debugQuery);
        $debugData = $debugStmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Ventas de los últimos 2 días: " . json_encode($debugData));
    }
    
    echo json_encode([
        'status' => 'success',
        'sales' => $allSales,
        'date' => $date,
        'server_date' => date('Y-m-d'),
        'server_time' => date('Y-m-d H:i:s'),
        'timezone' => date_default_timezone_get(),
        'debug_info' => [
            'active_sales' => count($activeSales),
            'cancelled_sales' => count($cancelledSales),
            'total_sales' => count($allSales)
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>