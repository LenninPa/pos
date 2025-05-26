<?php
// search_ticket.php - Buscar un ticket específico por número
session_start();
include '../config/conn.php';

header('Content-Type: application/json');

try {
    // Verificar que se recibió el número de ticket
    if (!isset($_POST['ticket_number']) || empty(trim($_POST['ticket_number']))) {
        throw new Exception('Número de ticket no proporcionado');
    }
    
    $ticketNumber = trim($_POST['ticket_number']);
    
    // Buscar la venta por número de ticket
    $query = "
        SELECT 
            id,
            ticket_number,
            ticket_name,
            date,
            sub_total,
            total
        FROM sales 
        WHERE ticket_number = :ticket_number
        LIMIT 1
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':ticket_number', $ticketNumber);
    $stmt->execute();
    
    $sale = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($sale) {
        echo json_encode([
            'status' => 'success',
            'sale' => $sale,
            'message' => 'Ticket encontrado'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ticket no encontrado'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>