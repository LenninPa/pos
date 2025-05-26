<!-- Modal de Asignación de Cliente - Completamente Dinámico -->
<div id="customer-assignment-modal" class="customer-modal" style="display: block;">
    <div class="customer-modal-content">
        <!-- Header del Modal -->
        <div class="customer-modal-header">
            <h2>Asignar Cliente</h2>
            <span class="close">&times;</span>
        </div>
        
        <!-- Body del Modal -->
        <div class="customer-modal-body">
            <!-- Panel Izquierdo - Lista de Clientes -->
            <div class="customers-list-panel">
                <!-- Buscador -->
                <div class="customer-search-container">
                    <input type="text" 
                           id="customer_search_input" 
                           placeholder="Buscar por nombre, teléfono, email..." 
                           class="customer-search-input">
                    <button id="customer_search_btn" class="customer-search-btn">
                        🔍
                    </button>
                </div>
                
                <!-- Botón Nuevo Cliente -->
                <button id="new_customer_btn" class="new-customer-btn">
                    + Nuevo Cliente
                </button>
                
                <!-- Contador de resultados -->
                <div id="customers_count" class="customers-count" style="display: none;">
                    <span id="customers_count_text">0 clientes encontrados</span>
                </div>
                
                <!-- Lista de Clientes (se llena dinámicamente) -->
                <div class="customers-list-container">
                    <div id="customers_list" class="customers-list">
                        <!-- Loading inicial -->
                        <div id="customers_loading" class="loading-message">
                            <div class="loading-spinner"></div>
                            <p>Cargando clientes...</p>
                        </div>
                        
                        <!-- Mensaje cuando no hay resultados -->
                        <div id="no_customers_message" class="no-customers-message" style="display: none;">
                            <div class="no-results-icon">👥</div>
                            <p>No se encontraron clientes</p>
                        </div>
                        
                        <!-- Aquí se insertan los clientes dinámicamente -->
                        <div id="customers_container"></div>
                    </div>
                </div>
            </div>
            
            <!-- Panel Derecho - Detalles del Cliente -->
            <div class="customer-details-panel">
                <h3>Detalles del Cliente</h3>
                <div id="customer_details_content" class="customer-details-container empty-state">
                    <div class="customer-icon">
                        👤
                    </div>
                    <p class="select-customer-message">
                        Selecciona un cliente de la lista para ver sus detalles
                    </p>
                    <div id="details_loading" class="loading-message" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Cargando detalles...</p>
                    </div>
                    <div id="customer_details_container" style="display: none;"></div>
                </div>
            </div>

        </div>
        
        <!-- Footer del Modal -->
        <div class="customer-modal-footer">
            <button id="cancel_customer_btn" class="btn-cancel">
                Cancelar
            </button>
            <button id="assign_customer_btn" class="btn-assign" disabled>
                Asignar Cliente
            </button>
        </div>
    </div>
</div>

<!-- Plantilla para mostrar cada cliente (se usa con JavaScript) -->
<template id="customer_item_template">
    <div class="customer-item" data-customer-id="">
        <div class="customer-name"></div>
        <div class="customer-contact">
            <span class="contact-icon">📞</span>
            <span class="contact-text"></span>
        </div>
        <div class="customer-email">
            <span class="email-icon">✉️</span>
            <span class="email-text"></span>
        </div>
        <div class="customer-type"></div>
    </div>
</template>

<!-- Plantilla para mostrar detalles del cliente -->
<template id="customer_details_template">
    <div class="customer-details-info">
        <div class="customer-header">
            <div class="customer-avatar">
                <span class="avatar-text"></span>
            </div>
            <div class="customer-main-name"></div>
            <div class="customer-type-detail"></div>
        </div>
        
        <div class="details-grid">
            <!-- Los detalles se insertan aquí dinámicamente -->
        </div>
    </div>
</template>