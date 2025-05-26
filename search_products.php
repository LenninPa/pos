<?php
// Limpiar cualquier output previo
ob_clean();

// Configurar headers
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');

// Iniciar sesión solo si no está iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en la salida

try {
    // Incluir conexión
    $config_path = '../config/conn.php';
    if (!file_exists($config_path)) {
        throw new Exception('Archivo de configuración no encontrado: ' . $config_path);
    }
    
    include $config_path;
    
    // Verificar si se recibió una consulta
    if (!isset($_POST['query']) || empty(trim($_POST['query']))) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error', 
            'message' => 'No se proporcionó una consulta válida'
        ]);
        exit;
    }
    
    $query = trim($_POST['query']);
    
    // Verificar conexión PDO
    if (!isset($pdo)) {
        throw new Exception('No se pudo establecer conexión con la base de datos');
    }
    
    // Preparar y ejecutar consulta - incluir inventory_use para lógica de inventario
    $sql = "SELECT code, product, price, stock, inventory_use, department FROM products WHERE product LIKE :query OR code LIKE :query ORDER BY product LIMIT 10";
    $stmt = $pdo->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Error al preparar la consulta SQL');
    }
    
    $searchQuery = "%{$query}%";
    $stmt->bindParam(':query', $searchQuery, PDO::PARAM_STR);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al ejecutar la consulta SQL');
    }
    
    // Obtener resultados
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Procesar cada producto para agregar department_id
    foreach ($products as &$product) {
        // BUSCAR EL ID del departamento por nombre (igual que en get_product.php)
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
    }
    
    // Limpiar output buffer antes de enviar JSON
    if (ob_get_level()) {
        ob_clean();
    }
    
    // Respuesta exitosa
    echo json_encode([
        'status' => 'success',
        'products' => $products,
        'count' => count($products),
        'query' => $query
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Limpiar output buffer
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error en la base de datos',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Limpiar output buffer
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error del servidor',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Asegurar que no hay output adicional
exit;
?>