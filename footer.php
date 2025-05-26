<div class="bottom_bar">
    <div class="bottom_options">
        <button class="bottom_options_main" id="CustomerAssing">Asignar a Cliente</button>
        <button class="bottom_options_main">Historial de Ventas</button>
        <form action="../sales_bar_actions/search_products.php" method="POST" class="form_ticket" id="quick_search_form">
            <input type="text" name="quick_search" id="quick_search" placeholder="Buscar Producto">
        </form>
    </div>
    <div class="bottom_complete_sale">
        <button class="complete_sale_button" id="btn_complete_sale">Cobrar</button>
    </div>
    <div class="total_display">
        <h5 class="total_display_subtotal">$0.00</h5>
        <h1 class="total_display_total">$0.00</h1>  
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar búsqueda rápida con eventos tanto para Enter como para tecleo
    const quickSearchForm = document.getElementById('quick_search_form');
    const quickSearchInput = document.getElementById('quick_search');
    let searchTimeout = null;
    
    if (quickSearchForm && quickSearchInput) {
        // Manejar envío del formulario (Enter)
        quickSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = quickSearchInput.value.trim();
            if (query !== '') {
                searchProductByName(query);
            }
        });
        
        // Manejar búsqueda en tiempo real (tecleo)
        quickSearchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            // Limpiar timeout anterior
            clearTimeout(searchTimeout);
            
            if (query.length >= 2) {
                // Esperar 300ms antes de buscar
                searchTimeout = setTimeout(() => {
                    searchProductByName(query, true); // true indica búsqueda en tiempo real
                }, 300);
            } else {
                // Ocultar resultados si hay menos de 2 caracteres
                hideSearchResults();
            }
        });
        
        // Limpiar resultados cuando se hace clic fuera del input
        document.addEventListener('click', function(e) {
            if (!quickSearchInput.contains(e.target) && !e.target.closest('.search-results-modal')) {
                hideSearchResults();
            }
        });
    }
    
    // Manejar clic en botón Cobrar
    const btnCompleteSale = document.getElementById('btn_complete_sale');
    if (btnCompleteSale) {
        btnCompleteSale.addEventListener('click', function() {
            completeSale();
        });
    }
});

// Función para búsqueda rápida de producto por nombre
function searchProductByName(query, isLiveSearch = false) {
    // Ruta corregida basada en la estructura real del proyecto
    // El archivo está en: php/sales_bar_actions/search_products.php
    const searchUrl = 'php/sales_bar_actions/search_products.php';
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', searchUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    xhr.onload = function() {
        if (this.status === 200) {
            // DEBUG: Mostrar la respuesta completa en consola
            console.log('Respuesta del servidor:', this.responseText);
            
            try {
                const response = JSON.parse(this.responseText);
                console.log('JSON parseado:', response);
                
                if (response.status === 'success' && response.products.length > 0) {
                    // Mostrar resultados
                    showProductSearchResults(response.products, isLiveSearch);
                } else if (!isLiveSearch) {
                    // Solo mostrar alerta si no es búsqueda en tiempo real
                    console.log('No se encontraron productos:', response.message);
                    alert('No se encontraron productos con ese nombre');
                }
            } catch (e) {
                console.error('Error al procesar la respuesta:', e);
                console.error('Respuesta que causó el error:', this.responseText);
                if (!isLiveSearch) {
                    alert('Error al procesar la respuesta. Ver consola para más detalles.');
                }
            }
        } else {
            console.error('Error en la petición HTTP:', this.status, this.statusText);
            console.error('Respuesta:', this.responseText);
            if (!isLiveSearch) {
                alert('Error en la conexión con el servidor');
            }
        }
    };
    
    xhr.onerror = function() {
        console.error('Error de red en la petición');
        if (!isLiveSearch) {
            alert('Error de conexión');
        }
    };
    
    xhr.send('query=' + encodeURIComponent(query));
}

// Función para ocultar resultados de búsqueda
function hideSearchResults() {
    const existingModal = document.querySelector('.search-results-modal');
    const existingOverlay = document.querySelector('.search-overlay');
    
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
    }
}

// Función para mostrar resultados de búsqueda
function showProductSearchResults(products, isLiveSearch = false) {
    // Limpiar resultados anteriores
    hideSearchResults();
    
    // Crear modal de resultados
    const modal = document.createElement('div');
    modal.className = 'search-results-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 20px;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
        z-index: 1000;
        max-height: 80vh;
        overflow: auto;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        border: 2px solid #29867E;
    `;
    
    // Crear encabezado
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #29867E;
    `;
    
    const title = document.createElement('h3');
    title.textContent = `Resultados de búsqueda (${products.length})`;
    title.style.cssText = `
        margin: 0;
        color: #29867E;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: #FF2A2A;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
    `;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    
    // Crear tabla de resultados
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
        max-height: 400px;
        overflow-y: auto;
    `;
    
    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #ddd;
    `;
    
    // Cabecera de tabla
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #29867E; color: white; position: sticky; top: 0;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Código</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Producto</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Precio</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Stock</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Acción</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Cuerpo de tabla
    const tbody = document.createElement('tbody');
    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.style.cssText = `
            background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};
            border-bottom: 1px solid #ddd;
        `;
        row.style.cursor = 'pointer';
        
        // Efecto hover
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e8f4f3';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        });
        
        // Lógica de inventario
        const inventoryUse = parseInt(product.inventory_use);
        const stock = parseInt(product.stock);
        
        // Determinar estado del producto
        let stockStatus = '';
        let stockColor = '';
        let canAdd = true;
        let buttonText = 'Agregar';
        let buttonColor = '#29867E';
        let buttonDisabled = '';
        
        if (inventoryUse === 1) {
            // Usa inventario
            if (stock > 0) {
                stockStatus = stock;
                stockColor = '#28a745'; // Verde
                canAdd = true;
            } else {
                stockStatus = 'Sin stock';
                stockColor = '#dc3545'; // Rojo
                canAdd = false;
                buttonText = 'Sin stock';
                buttonColor = '#6c757d'; // Gris
                buttonDisabled = 'disabled';
            }
        } else {
            // No usa inventario
            stockStatus = 'Sin límite';
            stockColor = '#007bff'; // Azul
            canAdd = true;
        }
        
        row.innerHTML = `
            <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace;">${product.code}</td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: 500;">${product.product}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #29867E;">${parseFloat(product.price).toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${stockColor}; font-weight: bold;">${stockStatus}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <button class="add-btn" data-code="${product.code}" data-can-add="${canAdd}" 
                        style="background-color: ${buttonColor}; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: ${canAdd ? 'pointer' : 'not-allowed'}; font-weight: bold; transition: all 0.3s;"
                        ${buttonDisabled}
                        onmouseover="if(this.getAttribute('data-can-add') === 'true') this.style.backgroundColor='#1e6b63'" 
                        onmouseout="this.style.backgroundColor='${buttonColor}'">
                    ${buttonText}
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    modal.appendChild(tableContainer);
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        z-index: 999;
    `;
    
    // Event listeners para cerrar modal
    closeBtn.addEventListener('click', hideSearchResults);
    overlay.addEventListener('click', hideSearchResults);
    
    // Manejar tecla ESC
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            hideSearchResults();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Agregar al DOM
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Manejar clics en botones de agregar
    const addButtons = modal.querySelectorAll('.add-btn');
    addButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Verificar si se puede agregar
            const canAdd = this.getAttribute('data-can-add') === 'true';
            if (!canAdd) {
                return; // No hacer nada si el botón está deshabilitado
            }
            
            const code = this.getAttribute('data-code');
            const selectedProduct = products.find(p => p.code === code);
            
            if (selectedProduct) {
                const inventoryUse = parseInt(selectedProduct.inventory_use);
                const stock = parseInt(selectedProduct.stock);
                
                // Verificar disponibilidad según lógica de inventario
                if (inventoryUse === 1 && stock <= 0) {
                    alert('Este producto no tiene stock disponible');
                    return;
                }
                
                // Formatear producto
                const formattedProduct = {
                    code: selectedProduct.code,
                    product: selectedProduct.product,
                    price: parseFloat(selectedProduct.price),
                    stock: stock,
                    inventory_use: inventoryUse,
                    department: selectedProduct.department,
                    department_id: selectedProduct.department_id
                };
                
                // Agregar a la tabla (asume que existe la función global)
                if (typeof window.addProductToTable === 'function') {
                    window.addProductToTable(formattedProduct);
                    
                    // Limpiar campo de búsqueda
                    const searchInput = document.getElementById('quick_search');
                    if (searchInput) {
                        searchInput.value = '';
                    }
                    
                    // Cerrar modal
                    hideSearchResults();
                    
                    // Enfocar campo de búsqueda para continuar
                    setTimeout(() => {
                        if (searchInput) {
                            searchInput.focus();
                        }
                    }, 100);
                } else {
                    alert('Error: No se pudo agregar el producto');
                }
            }
        });
    });
}

// Resto del código de completeSale permanece igual...
// [Aquí va el resto del código que ya tenías para completeSale]

// Función para completar la venta
function completeSale() {
    // Cargar datos
    let posData = window.posStorage.loadData();
    const activeTicket = window.posStorage.getActiveTicket(posData);
    
    if (!activeTicket || !activeTicket.products || activeTicket.products.length === 0) {
        alert('No hay productos en el ticket actual');
        return;
    }
    
    // Guarda el ID del ticket activo
    const activeTicketId = activeTicket.id;
    
    // Determinar nombre del ticket
    let ticketName = activeTicket.name;
    const displayName = activeTicket.displayName || '';
    
    if (displayName.startsWith('Ticket #')) {
        ticketName = "Cliente común";
    }
    
    const products = activeTicket.products;
    
    // Calcular subtotal y total
    let subtotal = 0;
    let total = 0;
    
    products.forEach(product => {
        const originalPrice = parseFloat(product.originalPrice);
        const price = parseFloat(product.price);
        const quantity = parseInt(product.quantity);
        
        subtotal += originalPrice * quantity;
        total += price * quantity;
    });
    
    // Mostrar confirmación
    if (confirm(`¿Desea completar la venta?\nTicket: ${displayName}\nSubtotal: $${subtotal.toFixed(2)}\nTotal: $${total.toFixed(2)}`)) {
        // Preparar datos
        const formData = new FormData();
        formData.append('products', JSON.stringify(products));
        formData.append('subtotal', subtotal.toFixed(2));
        formData.append('total', total.toFixed(2));
        formData.append('ticket_name', ticketName);
        
        // Enviar al servidor
        fetch('php/process_sale.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                
                if (data.status === 'success') {
                    alert('Venta completada exitosamente');
                    
                    // Recargar datos actualizados
                    posData = window.posStorage.loadData();
                    
                    // LÓGICA SIMPLIFICADA PARA MANEJAR LOS TICKETS
                    if (posData.tickets.length <= 1) {
                        // Caso 1: Solo hay un ticket - Simplemente vaciar sus productos
                        posData.tickets[0].products = [];
                        posData.tickets[0].name = "Cliente común";
                        posData.tickets[0].displayName = "Ticket #1";
                        window.posStorage.saveData(posData);
                        
                        // Recargar datos y productos
                        posData = window.posStorage.loadData();
                        window.renderProductsFromStorage();
                    } else {
                        // Caso 2: Hay múltiples tickets - Eliminar el actual directamente
                        posData.tickets = posData.tickets.filter(ticket => ticket.id !== activeTicketId);
                        
                        // Si eliminamos el ticket activo, cambiar a otro
                        if (activeTicketId === posData.activeTicketId && posData.tickets.length > 0) {
                            posData.activeTicketId = posData.tickets[0].id;
                        }
                        
                        // Guardar cambios
                        window.posStorage.saveData(posData);
                        
                        // Recargar datos
                        posData = window.posStorage.loadData();
                        
                        // Actualizar UI manualmente
                        const ticketsContainer = document.getElementById('tickets-container');
                        if (ticketsContainer) {
                            ticketsContainer.innerHTML = '';
                            
                            // Renderizar tickets actualizados
                            posData.tickets.forEach((ticket, index) => {
                                const ticketElem = document.createElement('div');
                                ticketElem.className = 'ticket_child';
                                ticketElem.dataset.ticketId = ticket.id;
                                ticketElem.dataset.ticketName = ticket.name;
                                
                                if (ticket.id === posData.activeTicketId) {
                                    ticketElem.classList.add('active');
                                }
                                
                                const nameSpan = document.createElement('span');
                                nameSpan.className = 'ticket-name';
                                nameSpan.contentEditable = true;
                                nameSpan.textContent = `Ticket #${index + 1}`;
                                
                                ticketElem.appendChild(nameSpan);
                                ticketsContainer.appendChild(ticketElem);
                            });
                            
                            // Agregar botones de eliminar
                            if (posData.tickets.length > 1) {
                                document.querySelectorAll('.ticket_child').forEach(ticket => {
                                    if (!ticket.querySelector('.delete-ticket-btn')) {
                                        const deleteBtn = document.createElement('span');
                                        deleteBtn.textContent = '×';
                                        deleteBtn.className = 'delete-ticket-btn';
                                        deleteBtn.style.marginLeft = '5px';
                                        deleteBtn.style.cursor = 'pointer';
                                        deleteBtn.style.color = 'red';
                                        deleteBtn.style.fontWeight = 'bold';
                                        
                                        deleteBtn.addEventListener('click', function(e) {
                                            e.stopPropagation();
                                            const ticketId = ticket.dataset.ticketId;
                                            if (confirm(`¿Eliminar ticket ${ticket.querySelector('.ticket-name').textContent}?`)) {
                                                const currentData = window.posStorage.loadData();
                                                if (currentData.tickets.length <= 1) {
                                                    alert('No se puede eliminar el único ticket.');
                                                    return;
                                                }
                                                window.posStorage.removeTicket(currentData, ticketId);
                                                location.reload();
                                            }
                                        });
                                        
                                        ticket.appendChild(deleteBtn);
                                    }
                                });
                            }
                        }
                        
                        // Cargar productos
                        window.renderProductsFromStorage();
                    }
                    
                    // Enfocar campo de código
                    const productCodeInput = document.getElementById('product_code');
                    if (productCodeInput) {
                        productCodeInput.focus();
                    }
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (e) {
                console.error('Error al procesar respuesta JSON:', e, text);
                alert('Error al procesar la respuesta del servidor');
            }
        })
        .catch(error => {
            console.error('Error en fetch:', error);
            alert('Error en la solicitud: ' + error);
        });
    }
}
</script>