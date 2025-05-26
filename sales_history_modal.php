<!-- Modal de Historial de Ventas -->
<style>
/* Estilos temporales para mejorar el scroll */
.sales-list-wrapper::-webkit-scrollbar,
.sale-details-wrapper::-webkit-scrollbar {
    width: 10px;
}

.sales-list-wrapper::-webkit-scrollbar-track,
.sale-details-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
}

.sales-list-wrapper::-webkit-scrollbar-thumb,
.sale-details-wrapper::-webkit-scrollbar-thumb {
    background: #b0b0b0;
    border-radius: 5px;
}

.sales-list-wrapper::-webkit-scrollbar-thumb:hover,
.sale-details-wrapper::-webkit-scrollbar-thumb:hover {
    background: #888;
}

/* Mejorar la apariencia de las filas seleccionadas */
#sales_list_table tbody tr.selected,
#sale_details_table tbody tr.selected {
    background-color: #e0f0ff !important;
    box-shadow: inset 0 0 0 2px #29867E;
}

/* Estilo para las filas al hacer hover */
#sales_list_table tbody tr:hover,
#sale_details_table tbody tr:hover {
    background-color: #f0f8ff !important;
}

/* Ajustar el padding de las celdas */
#sales_list_table td,
#sale_details_table td {
    padding: 10px 8px;
}

/* Hacer que el contenedor central tenga altura fija */
.sales-history-middle {
    height: 400px;
}
</style>
<div id="salesHistoryModal" class="modal_history" style="display: none;">
    <div class="modal-content_sales-history-modal">
        <div class="modal-header">
            <span id="closeSalesHistoryModal" class="close">&times;</span>
            <h2>Historial de Ventas</h2>
        </div>
        
        <div class="modal-body">
            <!-- Contenedor Superior -->
            <div class="sales-history-top">
                <!-- Buscar Ticket -->
                <div class="search-ticket-container">
                    <h3>Buscar Ticket</h3>
                    <input type="text" id="search_ticket_number" placeholder="Número de ticket">
                    <button id="btn_search_ticket">Buscar</button>
                </div>
                
                <!-- Número del Ticket Seleccionado -->
                <div class="selected-ticket-info">
                    <h3>Número del Ticket</h3>
                    <div id="selected_ticket_number">-</div>
                </div>
            </div>
            
            <!-- Contenedor Central -->
            <div class="sales-history-middle">
                <!-- Panel Izquierdo - Lista de Ventas -->
                <div class="sales-list-container">
                    <h3>Ventas en General</h3>
                    <div class="sales-list-wrapper" style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; background: #fff;">
                        <table id="sales_list_table">
                            <thead style="position: sticky; top: 0; background: #29867E; color: white; z-index: 10;">
                                <tr>
                                    <th style="padding: 10px 8px;">Ticket</th>
                                    <th style="padding: 10px 8px;">Hora</th>
                                    <th style="padding: 10px 8px;">Artículos</th>
                                    <th style="padding: 10px 8px;">Total</th>
                                </tr>
                            </thead>
                            <tbody id="sales_list_body">
                                <!-- Las ventas se cargarán aquí dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Panel Derecho - Descripción -->
                <div class="sale-details-container">
                    <h3>Descripción</h3>
                    <div class="sale-details-wrapper" style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e0; background: #fff;">
                        <table id="sale_details_table">
                            <thead style="position: sticky; top: 0; background: #29867E; color: white; z-index: 10;">
                                <tr>
                                    <th style="padding: 10px 8px;">Producto</th>
                                    <th style="padding: 10px 8px;">Cant.</th>
                                    <th style="padding: 10px 8px;">Precio</th>
                                    <th style="padding: 10px 8px;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody id="sale_details_body">
                                <!-- Los detalles se cargarán aquí dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Contenedor Inferior -->
            <div class="sales-history-bottom">
                <!-- Panel Izquierdo Inferior - Buscar por Fecha -->
                <div class="search-by-date-container">
                    <h3>Buscar por Fecha</h3>
                    <?php
                    // Establecer zona horaria de El Salvador
                    date_default_timezone_set('America/El_Salvador');
                    ?>
                    <input type="date" id="search_date" value="<?php echo date('Y-m-d'); ?>">
                    <button id="btn_search_by_date">Buscar</button>
                </div>
                
                <!-- Panel Derecho Inferior - Información y Acciones -->
                <div class="sale-actions-container">
                    <div class="sale-summary">
                        <div class="ticket-name">
                            <label>Cliente:</label>
                            <span id="ticket_customer_name">-</span>
                        </div>
                        <div class="ticket-total">
                            <label>Total:</label>
                            <span id="ticket_total_amount">$0.00</span>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button id="btn_delete_item" class="btn-danger" disabled>Eliminar Artículo Seleccionado</button>
                        <button id="btn_delete_sale" class="btn-danger" disabled>Eliminar Venta</button>
                        <button id="btn_reprint" class="btn-primary" disabled>Reimprimir</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>