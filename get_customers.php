<?php
// get_customers.php - Versión corregida
// Configurar headers antes que cualquier salida
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Deshabilitar errores que puedan contaminar la salida JSON
error_reporting(0);
ini_set('display_errors', 0);

try {
    // Ajustar la ruta según tu estructura de archivos
    // Prueba diferentes rutas hasta encontrar la correcta:
    $possible_paths = [
        '../config/conn.php',
    ];
    
    $database_included = false;
    foreach ($possible_paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $database_included = true;
            break;
        }
    }
    
    if (!$database_included) {
        throw new Exception('No se pudo encontrar el archivo de configuración de base de datos');
    }
    
    // Verificar que la conexión PDO existe
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new Exception('La conexión a la base de datos no está disponible');
    }
    
    $action = $_POST['action'] ?? $_GET['action'] ?? '';
    
    switch($action) {
        case 'get_customers':
            echo json_encode(getAllCustomers($pdo));
            break;
            
        case 'search_customers':
            $search = $_POST['search_term'] ?? '';
            echo json_encode(searchCustomers($pdo, $search));
            break;
            
        case 'get_customer_details':
            $id = $_POST['customer_id'] ?? 0;
            echo json_encode(getCustomerDetails($pdo, $id));
            break;

        // Nuevo caso para añadir clientes
        case 'add_customer':
            echo json_encode(addCustomer($pdo, $_POST));
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del sistema: ' . $e->getMessage()]);
}

function getAllCustomers($pdo) {
    try {
        $sql = "SELECT 
                    id, 
                    codigo, 
                    nombre_completo, 
                    telefono, 
                    celular,
                    email,
                    tipo_cliente
                FROM customers 
                WHERE activo = 1 
                ORDER BY nombre_completo ASC 
                LIMIT 100";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Limpiar datos nulos
        foreach($customers as &$customer) {
            $customer['telefono'] = $customer['telefono'] ?? 'Sin teléfono';
            $customer['celular'] = $customer['celular'] ?? 'Sin celular';
            $customer['email'] = $customer['email'] ?? 'Sin email';
            $customer['tipo_cliente'] = $customer['tipo_cliente'] ?? 'Cliente general';
        }
        
        return [
            'success' => true,
            'customers' => $customers,
            'total' => count($customers)
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error al obtener clientes: ' . $e->getMessage()];
    }
}

function searchCustomers($pdo, $searchTerm) {
    try {
        if (empty(trim($searchTerm))) {
            return getAllCustomers($pdo);
        }
        
        $search = "%{$searchTerm}%";
        $sql = "SELECT 
                    id, 
                    codigo, 
                    nombre_completo, 
                    telefono, 
                    celular,
                    email,
                    tipo_cliente
                FROM customers 
                WHERE activo = 1 
                AND (
                    nombre_completo LIKE ? 
                    OR telefono LIKE ? 
                    OR celular LIKE ?
                    OR email LIKE ?
                    OR codigo LIKE ?
                )
                ORDER BY nombre_completo ASC 
                LIMIT 50";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$search, $search, $search, $search, $search]);
        $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Limpiar datos nulos
        foreach($customers as &$customer) {
            $customer['telefono'] = $customer['telefono'] ?? 'Sin teléfono';
            $customer['celular'] = $customer['celular'] ?? 'Sin celular';
            $customer['email'] = $customer['email'] ?? 'Sin email';
            $customer['tipo_cliente'] = $customer['tipo_cliente'] ?? 'Cliente general';
        }
        
        return [
            'success' => true,
            'customers' => $customers,
            'total' => count($customers)
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error en la búsqueda: ' . $e->getMessage()];
    }
}

function getCustomerDetails($pdo, $customerId) {
    try {
        if (empty($customerId)) {
            return ['success' => false, 'message' => 'ID de cliente requerido'];
        }
        
        $sql = "SELECT 
                    id, 
                    codigo, 
                    nombre_completo, 
                    telefono, 
                    celular,
                    email, 
                    direccion,
                    tipo_cliente,
                    departamento,
                    municipio,
                    nit,
                    dui,
                    giro,
                    nombre_comercial,
                    nrc,
                    categoria_contribuyente,
                    exento_iva,
                    contribuyente_iva,
                    regimen_fiscal,
                    fecha_registro,
                    ultima_actualizacion
                FROM customers 
                WHERE id = ? AND activo = 1";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$customer) {
            return ['success' => false, 'message' => 'Cliente no encontrado'];
        }
        
        // Limpiar campos null
        $customer['telefono'] = $customer['telefono'] ?? 'Sin teléfono';
        $customer['celular'] = $customer['celular'] ?? 'Sin celular';
        $customer['email'] = $customer['email'] ?? 'Sin email';
        $customer['direccion'] = $customer['direccion'] ?? 'Sin dirección';
        $customer['tipo_cliente'] = $customer['tipo_cliente'] ?? 'Cliente general';
        $customer['departamento'] = $customer['departamento'] ?? 'No especificado';
        $customer['municipio'] = $customer['municipio'] ?? 'No especificado';
        $customer['nit'] = $customer['nit'] ?? 'Sin NIT';
        $customer['dui'] = $customer['dui'] ?? 'Sin DUI';
        $customer['giro'] = $customer['giro'] ?? 'No especificado';
        $customer['nombre_comercial'] = $customer['nombre_comercial'] ?? $customer['nombre_completo'];
        
        // Formatear fechas si existen
        if ($customer['fecha_registro']) {
            $customer['fecha_registro_formatted'] = date('d/m/Y H:i', strtotime($customer['fecha_registro']));
        }
        
        if ($customer['ultima_actualizacion']) {
            $customer['ultima_actualizacion_formatted'] = date('d/m/Y H:i', strtotime($customer['ultima_actualizacion']));
        }
        
        return [
            'success' => true,
            'customer' => $customer
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error al obtener detalles: ' . $e->getMessage()];
    }
}

/**
 * Función para añadir un nuevo cliente a la base de datos.
 * @param PDO $pdo Objeto PDO de la conexión a la base de datos.
 * @param array $data Array asociativo con los datos del nuevo cliente.
 * @return array Resultado de la operación (success, message, customer_id).
 */
function addCustomer($pdo, $data) {
    try {
        $nombre_completo = trim($data['nombre_completo'] ?? '');
        if (empty($nombre_completo)) {
            return ['success' => false, 'message' => 'El nombre completo es obligatorio.'];
        }

        // Generar un código único para el cliente, por ejemplo, CL-Timestamp
        $codigo = 'CL-' . time();

        $sql = "INSERT INTO customers (
                    codigo, 
                    nombre_completo, 
                    telefono, 
                    celular, 
                    email, 
                    direccion, 
                    tipo_cliente, 
                    nit, 
                    dui, 
                    giro,
                    activo,
                    fecha_registro,
                    ultima_actualizacion
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                    1, NOW(), NOW()
                )";
        
        $stmt = $pdo->prepare($sql);
        $executed = $stmt->execute([
            $codigo,
            $nombre_completo,
            $data['telefono'] ?? null,
            $data['celular'] ?? null,
            $data['email'] ?? null,
            $data['direccion'] ?? null,
            $data['tipo_cliente'] ?? 'Consumidor Final',
            $data['nit'] ?? null,
            $data['dui'] ?? null,
            $data['giro'] ?? null
        ]);

        if ($executed) {
            return [
                'success' => true, 
                'message' => 'Cliente añadido exitosamente.', 
                'customer_id' => $pdo->lastInsertId()
            ];
        } else {
            return ['success' => false, 'message' => 'No se pudo añadir el cliente.'];
        }

    } catch (PDOException $e) {
        // En un entorno de producción, es mejor loggear el error y dar un mensaje genérico.
        return ['success' => false, 'message' => 'Error de base de datos al añadir cliente: ' . $e->getMessage()];
    }
}
?>