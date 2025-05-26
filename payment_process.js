// payment_process.js - Funcionalidad del modal de pagos INTEGRADA CON SISTEMA DE TICKETS
document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 INICIANDO SISTEMA DE PAGO - VERSIÓN INTEGRADA CON TICKETS');
    
    // FORZAR LA REMOCIÓN DE EVENTOS PREVIOS EN EL BOTÓN COBRAR
    const oldBtnCompleteSale = document.getElementById('btn_complete_sale');
    if (oldBtnCompleteSale) {
        const newBtnCompleteSale = oldBtnCompleteSale.cloneNode(true);
        oldBtnCompleteSale.parentNode.replaceChild(newBtnCompleteSale, oldBtnCompleteSale);
        console.log('🔄 Botón cobrar clonado para remover eventos previos');
    }
    
    // Referencias a elementos DOM
    const btnCompleteSale = document.getElementById('btn_complete_sale');
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModal');
    const cancelPaymentBtn = document.getElementById('cancel_payment');
    const processPaymentBtn = document.getElementById('process_payment');
    const processPrintPaymentBtn = document.getElementById('process_print_payment');
    const paymentTotalInput = document.getElementById('payment_total');
    const paymentAmountInput = document.getElementById('payment_amount');
    const paymentChangeInput = document.getElementById('payment_change');
    
    console.log('Botón cobrar encontrado:', !!btnCompleteSale);
    console.log('Modal encontrado:', !!paymentModal);
    
    // Variable global para productos del ticket actual
    window.currentTicketProducts = [];
    
    // Formatear moneda
    function formatCurrency(value) {
        return new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    }
    
    // Calcular cambio
    function calculateChange() {
        const total = parseFloat(paymentTotalInput.value.replace(/[^\d.-]/g, '')) || 0;
        const amount = parseFloat(paymentAmountInput.value) || 0;
        const change = amount - total;
        
        paymentChangeInput.value = change >= 0 ? formatCurrency(change) : formatCurrency(0);
        
        // Actualizar estilos
        paymentAmountInput.classList.remove('valid', 'invalid');
        paymentChangeInput.classList.remove('positive', 'negative');
        
        if (amount >= total) {
            paymentAmountInput.classList.add('valid');
            paymentChangeInput.classList.add('positive');
        } else {
            paymentAmountInput.classList.add('invalid');
            paymentChangeInput.classList.add('negative');
        }
    }
    
    // Obtener el nombre del cliente desde el sistema de tickets - CORREGIDA
    function getCustomerNameFromTicketSystem() {
        console.log('🎫 Obteniendo nombre del cliente desde sistema de tickets...');
        
        // Método principal: Acceder directamente al ticket activo
        if (window.TicketSystem && window.TicketSystem.state && window.TicketSystem.state.activeTicketId) {
            const activeTicket = window.TicketSystem.state.tickets.find(
                t => t.id === window.TicketSystem.state.activeTicketId
            );
            
            if (activeTicket) {
                // Prioridad 1: customerName explícito
                if (activeTicket.customerName) {
                    console.log('✅ CustomerName encontrado:', activeTicket.customerName);
                    return activeTicket.customerName;
                }
                
                // Prioridad 2: Si el nombre no sigue el patrón "Ticket X"
                const defaultPattern = /^Ticket\s+\d+$/;
                if (!defaultPattern.test(activeTicket.name)) {
                    console.log('✅ Nombre personalizado del ticket:', activeTicket.name);
                    return activeTicket.name;
                }
            }
        }
        
        // Método alternativo: Usar el API público
        if (window.manageTickets && typeof window.manageTickets.getCustomerName === 'function') {
            const customerName = window.manageTickets.getCustomerName();
            if (customerName && customerName !== 'Cliente Común') {
                console.log('✅ Nombre obtenido desde API:', customerName);
                return customerName;
            }
        }
        
        console.log('⚠️ Usando nombre por defecto: Cliente Común');
        return 'Cliente Común';
    }
    
    // Extraer productos directamente de la tabla
    function getProductsFromTable() {
        console.log('📊 Extrayendo productos de la tabla...');
        
        const tableRows = document.querySelectorAll('.table_form_body .table_form_row');
        const products = [];
        
        if (tableRows.length === 0) {
            console.warn('⚠️ No se encontraron filas en la tabla');
            return products;
        }
        
        tableRows.forEach((row, index) => {
            try {
                const codeCell = row.querySelector('[data-field="code"]');
                const nameCell = row.querySelector('[data-field="product"]');
                const priceCell = row.querySelector('[data-field="price"]');
                const quantityCell = row.querySelector('[data-field="quantity"]');
                const discountCell = row.querySelector('[data-field="discount"]');
                
                if (!codeCell || !nameCell || !priceCell || !quantityCell) {
                    console.warn(`⚠️ Fila ${index}: celdas faltantes`);
                    return;
                }
                
                const code = codeCell.textContent.trim();
                const name = nameCell.textContent.trim();
                const price = parseFloat(priceCell.textContent.replace(/[^\d.-]/g, ''));
                const quantity = parseInt(quantityCell.dataset.value || quantityCell.textContent);
                const originalPrice = parseFloat(priceCell.dataset.original || price);
                const discount = discountCell ? parseFloat(discountCell.dataset.percentage || 0) : 0;
                
                if (!code || code === '') {
                    console.warn(`⚠️ Fila ${index}: código vacío, saltando`);
                    return;
                }
                
                const departmentId = row.dataset.departmentId || null;
                const departmentName = row.dataset.departmentName || null;
                
                console.log(`🏢 Fila ${index + 1} - Department:`, departmentId, departmentName);
                
                if (code && name && !isNaN(price) && !isNaN(quantity) && quantity > 0) {
                    products.push({
                        code: code,
                        product: name,
                        name: name,
                        price: price,
                        original_price: originalPrice,
                        quantity: quantity,
                        discount: discount,
                        department_id: departmentId,
                        department_name: departmentName,
                        subtotal: price * quantity
                    });
                    
                    console.log(`✅ Producto ${index + 1}: ${name} (${quantity} x $${price})`);
                }
            } catch (error) {
                console.error(`❌ Error procesando fila ${index}:`, error);
            }
        });
        
        console.log(`📦 Total productos extraídos: ${products.length}`);
        return products;
    }
    
    // Mostrar modal de pago
    function showPaymentModal() {
        console.log('💳 ¡MODAL ABRIENDO!');
        
        if (!paymentModal) {
            alert('❌ Error: Modal no encontrado');
            return;
        }
        
        // Obtener productos
        let products = getProductsFromTable();
        
        if (products.length === 0) {
            alert('❌ No hay productos en el ticket actual');
            console.log('❌ No se encontraron productos');
            return;
        }
        
        console.log('✅ Productos encontrados:', products.length);
        
        // Calcular total
        let total = 0;
        products.forEach(product => {
            const price = parseFloat(product.price);
            const quantity = parseInt(product.quantity);
            total += price * quantity;
        });
        
        // Guardar productos para usar en el procesamiento
        window.currentTicketProducts = products;
        
        // Mostrar el total en el modal
        paymentTotalInput.value = formatCurrency(total);
        paymentAmountInput.value = total.toFixed(2);
        calculateChange();
        
        // Mostrar el modal
        paymentModal.style.display = 'flex';
        console.log('✅ Modal mostrado');
        
        // Enfocar el campo de cantidad
        setTimeout(() => {
            paymentAmountInput.focus();
            paymentAmountInput.select();
        }, 200);
    }
    
    // Cerrar modal
    function closePaymentModal() {
        console.log('🔒 Cerrando modal...');
        if (paymentModal) {
            paymentModal.style.display = 'none';
            console.log('✅ Modal cerrado');
        }
        
        // Limpiar clases de validación
        if (paymentAmountInput) {
            paymentAmountInput.classList.remove('valid', 'invalid');
        }
        if (paymentChangeInput) {
            paymentChangeInput.classList.remove('positive', 'negative');
        }
    }
    
    // Procesar pago
    function processPayment(shouldPrint = false) {
        console.log(`🔄 Procesando pago... (Imprimir: ${shouldPrint})`);
        
        const total = parseFloat(paymentTotalInput.value.replace(/[^\d.-]/g, '')) || 0;
        const amount = parseFloat(paymentAmountInput.value) || 0;
        
        if (amount < total) {
            alert('❌ El monto entregado es menor que el total a pagar');
            return;
        }
        
        if (!window.currentTicketProducts || window.currentTicketProducts.length === 0) {
            alert('❌ No hay productos para procesar');
            return;
        }
        
        // Cerrar modal antes de procesar
        closePaymentModal();
        
        // Proceder con el procesamiento de la venta
        processExistingSale(shouldPrint, amount);
    }
    
    // Función principal para procesar la venta
    function processExistingSale(shouldPrint, amountPaid) {
        console.log('🏪 Enviando venta al servidor...');
        
        const products = window.currentTicketProducts;
        
        // Calcular subtotal y total
        let subtotal = 0;
        let total = 0;
        
        products.forEach(product => {
            const originalPrice = parseFloat(product.original_price || product.price);
            const price = parseFloat(product.price);
            const quantity = parseInt(product.quantity);
            
            subtotal += originalPrice * quantity;
            total += price * quantity;
        });
        
        // Obtener el nombre del cliente
        const customerName = getCustomerNameFromTicketSystem();
        console.log('🎫 Nombre del cliente final:', customerName);
        
        // Preparar datos
        const formData = new FormData();
        formData.append('products', JSON.stringify(products));
        formData.append('subtotal', subtotal.toFixed(2));
        formData.append('total', total.toFixed(2));
        formData.append('ticket_name', customerName);
        
        console.log('📤 Datos a enviar:', {
            productos: products.length,
            subtotal: subtotal,
            total: total,
            ticket_name: customerName
        });
        
        // Mostrar indicador de carga
        const btnCompleteSale = document.getElementById('btn_complete_sale');
        const originalText = btnCompleteSale ? btnCompleteSale.textContent : '';
        if (btnCompleteSale) {
            btnCompleteSale.textContent = 'Procesando...';
            btnCompleteSale.disabled = true;
        }
        
        // Enviar al servidor
        fetch('php/sales_bar_actions/process_sale.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            console.log('📄 Respuesta del servidor:', text);
            
            try {
                const data = JSON.parse(text);
                
                if (data.status === 'success') {
                    console.log('✅ Venta procesada exitosamente:', data);
                    
                    if (shouldPrint) {
                        printReceipt(data.ticket_number, data.subtotal, data.total, products, amountPaid, customerName);
                    }
                    
                    // Limpiar la interfaz
                    clearCurrentSale();
                    
                    alert(`✅ Venta procesada correctamente\nCliente: ${customerName}\nTicket #${data.ticket_number}\nTotal: ${formatCurrency(data.total)}`);
                    
                } else {
                    console.error('❌ Error del servidor:', data);
                    alert('❌ Error: ' + (data.message || 'Error desconocido'));
                }
            } catch (e) {
                console.error('❌ Error procesando JSON:', e);
                console.error('Respuesta cruda:', text);
                alert('❌ Error en la respuesta del servidor');
            }
        })
        .catch(error => {
            console.error('❌ Error de red:', error);
            alert('❌ Error de conexión: ' + error.message);
        })
        .finally(() => {
            if (btnCompleteSale) {
                btnCompleteSale.textContent = originalText;
                btnCompleteSale.disabled = false;
            }
        });
    }
    
    // Limpiar la venta actual - CORREGIDA
    function clearCurrentSale() {
        console.log('🧹 Limpiando interfaz...');
        
        if (window.TicketSystem && window.TicketSystem.state.initialized) {
            try {
                console.log('Limpiando usando sistema de tickets...');
                
                const activeTicketId = window.TicketSystem.state.activeTicketId;
                const activeTicket = window.TicketSystem.state.tickets.find(t => t.id === activeTicketId);
                
                if (activeTicket) {
                    // Verificar si tiene nombre personalizado
                    const hasCustomName = activeTicket.customerName || 
                                        (activeTicket.name && !activeTicket.name.match(/^Ticket\s+\d+$/));
                    
                    console.log(`Ticket activo: ${activeTicket.name}, personalizado: ${hasCustomName}`);
                    
                    // Limpiar productos
                    activeTicket.products = [];
                    
                    if (window.TicketSystem.state.tickets.length === 1) {
                        if (hasCustomName) {
                            console.log('Un solo ticket personalizado, eliminando...');
                            window.TicketSystem.deleteTicket(activeTicketId);
                        } else {
                            console.log('Un solo ticket sin personalizar, limpiando...');
                            activeTicket.name = 'Ticket 1';
                            activeTicket.customerName = null;
                            
                            if (window.TicketSystem.elements.productTableBody) {
                                window.TicketSystem.elements.productTableBody.innerHTML = '';
                            }
                            
                            window.TicketSystem.updateTicketProductCounters();
                        }
                    } else {
                        console.log('Múltiples tickets, eliminando el actual...');
                        window.TicketSystem.deleteTicket(activeTicketId);
                    }
                    
                    window.TicketSystem.saveToStorage();
                    
                    console.log('✅ Interfaz limpiada usando sistema de tickets');
                }
            } catch (e) {
                console.warn('Error al limpiar usando sistema de tickets:', e);
                clearTableDirectly();
            }
        } else {
            clearTableDirectly();
        }
        
        function clearTableDirectly() {
            console.log('Limpiando tabla directamente...');
            const tableBody = document.querySelector('.table_form_body');
            if (tableBody) {
                tableBody.innerHTML = '';
            }
            
            const subtotalDisplay = document.querySelector('.total_display_subtotal');
            const totalDisplay = document.querySelector('.total_display_total');
            if (subtotalDisplay) subtotalDisplay.textContent = '$0.00';
            if (totalDisplay) totalDisplay.textContent = '$0.00';
            
            console.log('✅ Interfaz limpiada directamente');
        }
        
        window.currentTicketProducts = [];
        
        const productCodeInput = document.getElementById('product_code');
        if (productCodeInput) {
            productCodeInput.focus();
        }
    }
    
    // Función para imprimir recibo
    function printReceipt(ticketNumber, subtotal, total, products, amountPaid, customerName = 'Cliente Común') {
        console.log('🖨️ Abriendo ventana de impresión...');
        
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
            alert('❌ No se pudo abrir la ventana de impresión. Verifique el bloqueador de ventanas emergentes.');
            return;
        }
        
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo #${ticketNumber}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        font-size: 12px; 
                        margin: 0;
                        padding: 20px;
                        line-height: 1.4;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .customer {
                        text-align: center;
                        margin-bottom: 15px;
                        padding: 5px;
                        border: 1px dashed #000;
                        background-color: #f9f9f9;
                    }
                    .item { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 3px; 
                    }
                    .item-name {
                        flex: 1;
                        margin-right: 10px;
                    }
                    .item-price {
                        text-align: right;
                        white-space: nowrap;
                    }
                    .totals { 
                        margin-top: 15px; 
                        border-top: 1px dashed #000; 
                        padding-top: 10px; 
                    }
                    .payment { 
                        margin-top: 10px; 
                        border-top: 1px dashed #000; 
                        padding-top: 10px; 
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 20px; 
                        border-top: 2px solid #000;
                        padding-top: 10px;
                        font-size: 10px;
                    }
                    h1 { margin: 5px 0; font-size: 16px; }
                    p { margin: 2px 0; }
                    .bold { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SU EMPRESA</h1>
                    <p>Dirección de la Empresa</p>
                    <p>Tel: 123-456-7890</p>
                    <p class="bold">Recibo #${ticketNumber}</p>
                    <p>Fecha: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="customer">
                    <p class="bold">Cliente: ${customerName}</p>
                </div>
                
                <div class="items">
                    ${products.map(product => `
                        <div class="item">
                            <div class="item-name">${product.quantity} x ${product.name || product.product}</div>
                            <div class="item-price">$${(product.price * product.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="totals">
                    <div class="item">
                        <span class="bold">Subtotal:</span>
                        <span class="bold">$${parseFloat(subtotal).toFixed(2)}</span>
                    </div>
                    <div class="item">
                        <span class="bold">TOTAL:</span>
                        <span class="bold">$${parseFloat(total).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="payment">
                    <div class="item">
                        <span>Efectivo:</span>
                        <span>$${parseFloat(amountPaid).toFixed(2)}</span>
                    </div>
                    <div class="item">
                        <span>Cambio:</span>
                        <span>$${(amountPaid - total).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p class="bold">¡Gracias por su compra!</p>
                    <p>Cliente: ${customerName}</p>
                    <p>Conserve este recibo</p>
                </div>
                
                <script>
                    window.onload = function() { 
                        setTimeout(function() {
                            window.print(); 
                            setTimeout(function() {
                                window.close();
                            }, 1000);
                        }, 500);
                    }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    }
    
    // Configurar eventos
    console.log('🔗 Configurando eventos...');
    
    // EVENTO PRINCIPAL DEL BOTÓN COBRAR
    if (btnCompleteSale) {
        btnCompleteSale.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 ¡BOTÓN COBRAR PRESIONADO!');
            showPaymentModal();
            return false;
        };
        
        console.log('✅ Evento configurado en el botón cobrar');
    } else {
        console.error('❌ BOTÓN COBRAR NO ENCONTRADO!');
    }
    
    // Eventos del modal
    if (closePaymentModalBtn) {
        closePaymentModalBtn.onclick = closePaymentModal;
    }
    
    if (cancelPaymentBtn) {
        cancelPaymentBtn.onclick = closePaymentModal;
    }
    
    if (processPaymentBtn) {
        processPaymentBtn.onclick = function() {
            processPayment(false);
        };
    }
    
    if (processPrintPaymentBtn) {
        processPrintPaymentBtn.onclick = function() {
            processPayment(true);
        };
    }
    
    // Calcular cambio cuando cambia el monto
    if (paymentAmountInput) {
        paymentAmountInput.addEventListener('input', calculateChange);
        paymentAmountInput.addEventListener('keyup', calculateChange);
    }
    
    // Cerrar modal con Escape y procesar con Enter
    document.addEventListener('keydown', function(e) {
        if (paymentModal && paymentModal.style.display === 'flex') {
            if (e.key === 'Escape') {
                e.preventDefault();
                closePaymentModal();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                processPayment(false);
            }
        }
    });
    
    // Cerrar modal al hacer clic fuera
    if (paymentModal) {
        paymentModal.addEventListener('click', function(e) {
            if (e.target === paymentModal) {
                closePaymentModal();
            }
        });
    }
    
    console.log('🎉 SISTEMA DE PAGO COMPLETAMENTE INICIALIZADO');
    console.log('📋 Elementos verificados:');
    console.log('  - Botón cobrar:', !!btnCompleteSale);
    console.log('  - Modal:', !!paymentModal);
    console.log('  - Campos del modal:', !!(paymentTotalInput && paymentAmountInput && paymentChangeInput));
    console.log('  - Sistema de tickets disponible:', !!(window.TicketSystem || window.manageTickets));
    
    // FUNCIÓN GLOBAL PARA PRUEBAS
    window.testPaymentModal = function() {
        console.log('🧪 PRUEBA MANUAL: Abriendo modal...');
        showPaymentModal();
    };
    
    window.testCustomerName = function() {
        console.log('🧪 PRUEBA: Obteniendo nombre del cliente...');
        const customerName = getCustomerNameFromTicketSystem();
        console.log('Resultado:', customerName);
        return customerName;
    };
});