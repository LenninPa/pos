<?php 
    session_start();
    include 'php/config/conn.php'; //Database connection.
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">    
    <title>POS</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/main.css">

</head>
<body>

    <?php include("php/sales_modals/sales_history_modal.php"); ?> 
    <?php include("php/sales_modals/customers_modal.php"); ?> 
    <?php include("php/sales_modals/bulk_insert.php"); ?> 
    <?php include("php/sales_modals/payment_modal.php"); ?>
    <!--Header always on top, even in page change.--->        
    <?php include("php/main/header.php"); ?> 

    <!--main sales options--->            
    <?php include("php/main/sales_main_bar.php"); ?>

    <!--Here we print input code bar and the prodcut table.--->
    <main class="main">
        <?php include("php/main/ticket_bar.php"); ?>    

        <?php include("php/main/product_display.php"); ?>        




    </main>

    <?php include("php/main/footer.php"); ?>
    
    <script type="text/javascript" src="js/sales_bar_functions/product_insert.js"></script>



<script type="text/javascript">
    // Suponiendo que este código se ejecuta después de recibir la respuesta JSON
function handleProductResponse(response) {
    if (!response.success) {
        // Mostrar mensaje en la interfaz (sin alert)
        
        // Si hay que mostrar un modal de inventario
        if (response.inventory_empty && response.modal_script) {
            // Crear el modal de inventario
            const modalOverlay = document.createElement("div");
            modalOverlay.id = "inventoryModalOverlay";
            modalOverlay.style.position = "fixed";
            modalOverlay.style.top = "0";
            modalOverlay.style.left = "0";
            modalOverlay.style.width = "100%";
            modalOverlay.style.height = "100%";
            modalOverlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            modalOverlay.style.display = "flex";
            modalOverlay.style.justifyContent = "center";
            modalOverlay.style.alignItems = "center";
            modalOverlay.style.zIndex = "9999";
            
            const modalContent = document.createElement("div");
            modalContent.style.backgroundColor = "#fff";
            modalContent.style.padding = "20px";
            modalContent.style.borderRadius = "5px";
            modalContent.style.maxWidth = "400px";
            modalContent.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            
            modalContent.innerHTML = `
                <h3 style="margin-top: 0; color: #cc0000;">¡Inventario Agotado!</h3>
                <p>El producto "${response.product_name}" no tiene existencias disponibles.</p>
                <div style="text-align: right; margin-top: 15px;">
                    <button onclick="document.body.removeChild(document.getElementById('inventoryModalOverlay'))" 
                            style="background-color: #cc0000; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer;">
                        Cerrar
                    </button>
                </div>
            `;
            
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);
            
            // Cerrar al hacer clic en el overlay
            modalOverlay.addEventListener("click", function(e) {
                if (e.target === modalOverlay) {
                    document.body.removeChild(modalOverlay);
                }
            });
        }
    } else {
        // Procesar el producto encontrado
        // ...
    }
}   
</script>
<script type="text/javascript" src="js/sales_bar_functions/bulk_products.js"></script>
<script type="text/javascript" src="js/sales_bar_functions/payment_process.js"></script>
<script type="text/javascript" src="js/sales_bar_functions/sales_history.js"></script>
<script type="text/javascript" src="js/sales_bar_functions/customer_modal.js"></script>


</body>
</html>