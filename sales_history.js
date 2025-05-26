// sales_history.js - Version completa con soporte para ventas canceladas
document.addEventListener('DOMContentLoaded', function() {
    
    var modal = document.getElementById('salesHistoryModal');
    var closeBtn = document.getElementById('closeSalesHistoryModal');
    var salesListBody = document.getElementById('sales_list_body');
    var saleDetailsBody = document.getElementById('sale_details_body');
    var searchTicketInput = document.getElementById('search_ticket_number');
    var searchDateInput = document.getElementById('search_date');
    var selectedTicketNumber = document.getElementById('selected_ticket_number');
    var ticketCustomerName = document.getElementById('ticket_customer_name');
    var ticketTotalAmount = document.getElementById('ticket_total_amount');
    var btnSearchTicket = document.getElementById('btn_search_ticket');
    var btnSearchByDate = document.getElementById('btn_search_by_date');
    var btnDeleteSale = document.getElementById('btn_delete_sale');
    var btnDeleteItem = document.getElementById('btn_delete_item');
    var btnReprint = document.getElementById('btn_reprint');
    
    var selectedSaleId = null;
    var selectedSaleRow = null;
    var selectedDetailRow = null;
    var selectedDetailId = null;
    var selectedSaleStatus = null; // Added to track the status of the selected sale
    var salesData = [];
    
    function openSalesHistoryModal() {
        modal.style.display = 'flex';
        var today = new Date();
        var currentDate = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
        console.log('Fecha actual para busqueda:', currentDate);
        searchDateInput.value = currentDate;
        loadSalesByDate(currentDate);
    }
    
    function closeSalesHistoryModal() {
        modal.style.display = 'none';
        clearSelection();
    }
    
    function loadSalesByDate(date) {
        console.log('Cargando ventas de la fecha:', date);
        salesListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando...</td></tr>';
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/sales_bar_actions/get_sales_history.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    console.log('Respuesta del servidor:', data);
                    if (data.status === 'success') {
                        displaySales(data.sales);
                    } else {
                        salesListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No se encontraron ventas</td></tr>';
                    }
                } catch (e) {
                    console.error('Error:', e);
                    salesListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error al cargar ventas</td></tr>';
                }
            }
        };
        
        xhr.send('date=' + encodeURIComponent(date));
    }
    
    function displaySales(sales) {
        salesData = sales;
        salesListBody.innerHTML = '';
        
        if (sales.length === 0) {
            salesListBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay ventas para mostrar</td></tr>';
            return;
        }
        
        for (var i = 0; i < sales.length; i++) {
            var sale = sales[i];
            var row = document.createElement('tr');
            row.dataset.saleId = sale.id;
            row.dataset.saleStatus = sale.status || 'active'; // Track sale status
            row.dataset.index = i;
            
            var saleDate = new Date(sale.date);
            var hora = saleDate.toLocaleTimeString('es-SV', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            
            // Crear las celdas normalmente
            var ticketCell = document.createElement('td');
            ticketCell.textContent = '#' + sale.ticket_number;
            
            var timeCell = document.createElement('td');
            timeCell.textContent = hora;
            
            var itemsCell = document.createElement('td');
            itemsCell.style.textAlign = 'center';
            itemsCell.textContent = sale.total_items || 0;
            
            var totalCell = document.createElement('td');
            totalCell.style.textAlign = 'right';
            totalCell.textContent = '$' + parseFloat(sale.total).toFixed(2);
            
            // Agregar las celdas a la fila
            row.appendChild(ticketCell);
            row.appendChild(timeCell);
            row.appendChild(itemsCell);
            row.appendChild(totalCell);
            
            // Si la venta está cancelada, aplicar estilos de cancelación
            if (sale.status === 'cancelled') {
                row.classList.add('sale-cancelled');
                row.style.backgroundColor = '#dc3545'; // Rojo
                row.style.color = 'white'; // Texto blanco
                row.style.textDecoration = 'line-through'; // Tachado
                row.style.position = 'relative';
                
                // Agregar tooltip con información de cancelación
                if (sale.comments) {
                    row.title = 'Motivo de cancelación: ' + sale.comments + 
                              (sale.cancelled_by ? '\nCancelado por: ' + sale.cancelled_by : '');
                }
            }
            
            row.onclick = function(saleData) {
                return function() {
                    selectSale(this, saleData);
                };
            }(sale);
            
            salesListBody.appendChild(row);
        }
        
        // Seleccionar primera venta activa si existe, sino la primera
        var firstActiveSale = sales.find(function(s) { return s.status !== 'cancelled'; });
        if (firstActiveSale) {
            var activeRow = salesListBody.querySelector('[data-sale-id="' + firstActiveSale.id + '"]');
            if (activeRow) {
                selectSale(activeRow, firstActiveSale);
            }
        } else if (sales.length > 0) {
            selectSale(salesListBody.firstChild, sales[0]);
        }
    }
    
    function selectSale(row, sale) {
        if (selectedSaleRow) {
            selectedSaleRow.classList.remove('selected');
        }
        
        row.classList.add('selected');
        selectedSaleRow = row;
        selectedSaleId = sale.id;
        selectedSaleStatus = sale.status || 'active'; // Track sale status
        
        selectedTicketNumber.textContent = '#' + sale.ticket_number;
        ticketCustomerName.textContent = sale.ticket_name || 'Cliente común';
        ticketTotalAmount.textContent = '$' + parseFloat(sale.total).toFixed(2);
        
        // Deshabilitar botones si la venta está cancelada
        if (sale.status === 'cancelled') {
            btnDeleteSale.disabled = true;
            btnDeleteItem.disabled = true;
            btnReprint.disabled = true;
            
            // Ocultar cliente y total cuando la venta está cancelada
            ticketCustomerName.parentNode.style.display = 'none';
            ticketTotalAmount.parentNode.style.display = 'none';
            
            // Mostrar información de cancelación dentro del contenedor de botones
            if (sale.comments) {
                var cancelInfo = document.createElement('div');
                cancelInfo.id = 'cancel-info';
                cancelInfo.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; margin-bottom: 8px; border-radius: 4px; font-size: 12px; color: #856404; width: 100%; box-sizing: border-box;';
                cancelInfo.innerHTML = '<strong>Venta Cancelada</strong><br>Motivo: ' + sale.comments + 
                                     (sale.cancelled_by ? '<br>Por: ' + sale.cancelled_by : '');
                
                // Remover info anterior si existe
                var existingInfo = document.getElementById('cancel-info');
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                // Insertar al inicio del contenedor de botones
                var actionButtons = document.querySelector('.action-buttons');
                if (actionButtons) {
                    actionButtons.insertAdjacentElement('afterbegin', cancelInfo);
                }
            }
            
            // Limpiar detalles para ventas canceladas
            saleDetailsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #dc3545; font-style: italic;">Esta venta ha sido cancelada</td></tr>';
            
        } else {
            btnDeleteSale.disabled = false;
            btnReprint.disabled = false;
            btnDeleteItem.disabled = true;
            
            // Mostrar cliente y total para ventas activas
            ticketCustomerName.parentNode.style.display = 'block';
            ticketTotalAmount.parentNode.style.display = 'block';
            
            // Remover info de cancelación si existe
            var existingInfo = document.getElementById('cancel-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            
            loadSaleDetails(sale.id);
        }
        
        selectedDetailRow = null;
        selectedDetailId = null;
    }
    
    function loadSaleDetails(saleId) {
        saleDetailsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando...</td></tr>';
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/sales_bar_actions/get_sale_details.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.status === 'success') {
                        displaySaleDetails(data.details);
                    } else {
                        saleDetailsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error al cargar detalles</td></tr>';
                    }
                } catch (e) {
                    console.error('Error:', e);
                    saleDetailsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Error al cargar detalles</td></tr>';
                }
            }
        };
        
        xhr.send('sale_id=' + encodeURIComponent(saleId));
    }
    
    function displaySaleDetails(details) {
        saleDetailsBody.innerHTML = '';
        
        if (details.length === 0) {
            saleDetailsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay detalles</td></tr>';
            return;
        }
        
        for (var i = 0; i < details.length; i++) {
            var detail = details[i];
            var row = document.createElement('tr');
            row.dataset.detailId = detail.id;
            row.dataset.index = i;
            
            row.innerHTML = '<td>' + detail.name + '</td>' +
                           '<td style="text-align: center;">' + detail.quantity + '</td>' +
                           '<td style="text-align: right;">$' + parseFloat(detail.price).toFixed(2) + '</td>' +
                           '<td style="text-align: right;">$' + parseFloat(detail.subtotal).toFixed(2) + '</td>';
            
            row.onclick = function(detailData) {
                return function() {
                    if (selectedSaleStatus !== 'cancelled') { // Prevent selection if sale is cancelled
                        selectDetail(this, detailData);
                    }
                };
            }(detail);
            
            saleDetailsBody.appendChild(row);
        }
    }
    
    function selectDetail(row, detail) {
        if (selectedDetailRow) {
            selectedDetailRow.classList.remove('selected');
        }
        
        row.classList.add('selected');
        selectedDetailRow = row;
        selectedDetailId = detail.id;
        
        btnDeleteItem.disabled = false;
    }
    
    function searchByTicket() {
        var ticketNumber = searchTicketInput.value.trim();
        
        if (!ticketNumber) {
            alert('Por favor ingrese un número de ticket');
            return;
        }
        
        for (var i = 0; i < salesData.length; i++) {
            if (salesData[i].ticket_number == ticketNumber) {
                var rows = salesListBody.querySelectorAll('tr');
                for (var j = 0; j < rows.length; j++) {
                    if (rows[j].dataset.saleId == salesData[i].id) {
                        selectSale(rows[j], salesData[i]);
                        rows[j].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }
                }
            }
        }
        
        alert('Ticket no encontrado en la fecha actual');
    }
    
    function clearSelection() {
        selectedSaleId = null;
        selectedSaleRow = null;
        selectedDetailRow = null;
        selectedDetailId = null;
        selectedSaleStatus = null; // Reset sale status
        
        if (selectedSaleRow) {
            selectedSaleRow.classList.remove('selected');
        }
        if (selectedDetailRow) {
            selectedDetailRow.classList.remove('selected');
        }
        
        selectedTicketNumber.textContent = '-';
        ticketCustomerName.textContent = '-';
        ticketTotalAmount.textContent = '$0.00';
        saleDetailsBody.innerHTML = '';
        
        // Mostrar cliente y total al limpiar selección
        ticketCustomerName.parentNode.style.display = 'block';
        ticketTotalAmount.parentNode.style.display = 'block';
        
        // Remover info de cancelación si existe
        var existingInfo = document.getElementById('cancel-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        btnDeleteItem.disabled = true;
        btnDeleteSale.disabled = true;
        btnReprint.disabled = true;
    }
    
    function deleteCompleteSale() {
        if (!selectedSaleId || selectedSaleStatus === 'cancelled') { // Prevent deletion of cancelled sales
            alert('No se puede eliminar una venta ya cancelada');
            return;
        }
        
        var ticketNumber = selectedTicketNumber.textContent;
        var customerName = ticketCustomerName.textContent;
        var totalAmount = ticketTotalAmount.textContent;
        
        var motivo = prompt('Ingrese el motivo para anular la venta (mínimo 10 caracteres):');
        
        if (!motivo || motivo.trim().length < 10) {
            alert('Debe proporcionar un motivo de al menos 10 caracteres');
            return;
        }
        
        var confirmMessage = '¿Está seguro de que desea eliminar completamente la venta?\n\n';
        confirmMessage += 'Ticket: ' + ticketNumber + '\n';
        confirmMessage += 'Cliente: ' + customerName + '\n';
        confirmMessage += 'Total: ' + totalAmount + '\n\n';
        confirmMessage += 'Esta acción no se puede deshacer.';
        
        if (confirm(confirmMessage)) {
            btnDeleteItem.disabled = true;
            btnDeleteSale.disabled = true;
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'php/sales_bar_actions/delete_complete_sale.php', true);
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.status === 'success') {
                            var successMessage = '✅ Venta anulada exitosamente\n\n';
                            successMessage += 'Ticket: ' + data.sale_info.ticket_number + '\n';
                            successMessage += 'Cliente: ' + data.sale_info.ticket_name + '\n';
                            successMessage += 'Total: $' + parseFloat(data.sale_info.total).toFixed(2) + '\n\n';
                            successMessage += '📝 La venta aparecerá marcada como CANCELADA en el historial';
                            
                            alert(successMessage);
                            clearSelection();
                            loadSalesByDate(searchDateInput.value);
                        } else {
                            alert('❌ Error al anular venta: ' + data.message);
                            btnDeleteItem.disabled = false;
                            btnDeleteSale.disabled = false;
                        }
                    } catch (e) {
                        alert('✅ Venta anulada exitosamente\n📝 La venta aparecerá marcada como CANCELADA');
                        clearSelection();
                        loadSalesByDate(searchDateInput.value);
                    }
                }
            };
            
            var formData = new FormData();
            formData.append('sale_id', selectedSaleId);
            formData.append('comments', motivo.trim());
            formData.append('cancelled_by', 'Administrador');
            
            xhr.send(formData);
        }
    }
    
    function deleteSelectedItem() {
        if (!selectedDetailId || !selectedSaleId || selectedSaleStatus === 'cancelled') { // Prevent modification of cancelled sales
            alert('No se puede modificar una venta cancelada');
            return;
        }
        
        var selectedProduct = selectedDetailRow.querySelector('td:first-child').textContent;
        var confirmMessage = '¿Está seguro de que desea eliminar el artículo "' + selectedProduct + '" de la venta?';
        
        if (confirm(confirmMessage)) {
            btnDeleteItem.disabled = true;
            btnDeleteSale.disabled = true;
            
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'php/sales_bar_actions/delete_sale_item.php', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.status === 'success') {
                            alert('✅ Artículo eliminado exitosamente');
                            
                            if (data.new_totals) {
                                ticketTotalAmount.textContent = '$' + data.new_totals.total.toFixed(2);
                                
                                if (selectedSaleRow) {
                                    var totalCell = selectedSaleRow.querySelector('td:last-child');
                                    if (totalCell) {
                                        totalCell.textContent = '$' + data.new_totals.total.toFixed(2);
                                    }
                                }
                            }
                            
                            loadSaleDetails(selectedSaleId);
                            loadSalesByDate(searchDateInput.value);
                            
                        } else if (data.last_item) {
                            alert(data.message);
                            btnDeleteItem.disabled = false;
                            btnDeleteSale.disabled = false;
                        } else {
                            alert('❌ Error al eliminar artículo: ' + data.message);
                            btnDeleteItem.disabled = false;
                            btnDeleteSale.disabled = false;
                        }
                    } catch (e) {
                        alert('Artículo eliminado exitosamente');
                        loadSaleDetails(selectedSaleId);
                        loadSalesByDate(searchDateInput.value);
                        btnDeleteItem.disabled = false;
                        btnDeleteSale.disabled = false;
                    }
                }
            };
            
            var requestBody = 'detail_id=' + encodeURIComponent(selectedDetailId) + '&sale_id=' + encodeURIComponent(selectedSaleId);
            xhr.send(requestBody);
        }
    }
    
    // Event Listeners principales
    closeBtn.onclick = closeSalesHistoryModal;
    btnDeleteSale.onclick = deleteCompleteSale;
    btnDeleteItem.onclick = deleteSelectedItem;
    btnSearchTicket.onclick = searchByTicket;
    
    btnSearchByDate.onclick = function() {
        loadSalesByDate(searchDateInput.value);
    };
    
    btnReprint.onclick = function() {
        if (!this.disabled) {
            alert('Funcionalidad "Reimprimir" pendiente de implementación');
        }
    };
    
    // Cerrar modal al hacer clic fuera
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeSalesHistoryModal();
        }
    };
    
    // Enter en campo de búsqueda de ticket
    searchTicketInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchByTicket();
        }
    };
    
    // Navegación con teclado básica
    document.onkeydown = function(e) {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeSalesHistoryModal();
            } else if (e.key === 'Delete' && selectedDetailId) {
                e.preventDefault();
                deleteSelectedItem();
            }
        }
    };
    
    // Hacer las tablas enfocables para navegación
    salesListBody.setAttribute('tabindex', '0');
    saleDetailsBody.setAttribute('tabindex', '0');
    
    salesListBody.onclick = function() {
        this.focus();
    };
    
    saleDetailsBody.onclick = function() {
        this.focus();
    };
    
    // Función global para abrir el modal
    window.openSalesHistory = openSalesHistoryModal;
    
    // Conectar con el botón del footer si existe
    var historyButton = document.querySelector('.bottom_options_main:nth-child(2)');
    if (historyButton && historyButton.textContent === 'Historial de Ventas') {
        historyButton.onclick = openSalesHistoryModal;
    }
    
    console.log('Sistema de historial de ventas inicializado completamente');
}); 