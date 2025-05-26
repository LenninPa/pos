<?php
// Este script obtiene departamentos desde la base de datos

// Inicializar respuesta
$response = [
    'status' => 'error',
    'message' => 'Error desconocido',
    'departments' => []
];

try {
    // Incluir conexión a la base de datos
    if (!file_exists('../config/conn.php')) {
        throw new Exception("Archivo de conexión no encontrado en: ../config/conn.php");
    }

    include '../config/conn.php';

    // Verificar si la conexión PDO existe
    if (!isset($pdo) || !$pdo) {
        throw new Exception("La conexión PDO no está definida o es nula");
    }

    // Preparar la consulta SQL usando PDO
    $query = "SELECT Id, name_dep FROM departments ORDER BY name_dep";
    $stmt = $pdo->query($query);
    
    // Verificar si hay error en la consulta
    if (!$stmt) {
        throw new Exception("Error en la consulta: " . $pdo->errorInfo()[2]);
    }
    
    // Obtener resultados usando PDO
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Verificar si se encontraron resultados
    if (count($departments) > 0) {
        // Actualizar respuesta con éxito
        $response['status'] = 'success';
        $response['message'] = 'Departamentos obtenidos con éxito';
        $response['departments'] = $departments;
    } else {
        // No se encontraron departamentos
        $response['message'] = 'No se encontraron departamentos';
    }
} catch (Exception $e) {
    // Capturar cualquier error
    $response['message'] = 'Error al consultar la base de datos: ' . $e->getMessage();
}

// Devolver respuesta en formato JSON
header('Content-Type: application/json');
echo json_encode($response);
// No incluir cierre de PHP para evitar caracteres adicionales