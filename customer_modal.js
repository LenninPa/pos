document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('customer-assignment-modal');
    const closeBtn = modal.querySelector('.close');
    const searchInput = document.getElementById('customer_search_input');
    const searchBtn = document.getElementById('customer_search_btn');
    const newCustomerBtn = document.getElementById('new_customer_btn');
    const cancelBtn = document.getElementById('cancel_customer_btn');
    const assignBtn = document.getElementById('assign_customer_btn');
    const customersContainer = document.getElementById('customers_container');
    const customersCount = document.getElementById('customers_count');
    const customersCountText = document.getElementById('customers_count_text');
    const loadingIndicator = document.getElementById('customers_loading');
    const noResultsMessage = document.getElementById('no_customers_message');

    // Elements for customer details panel - using second script's better structure
    const customerDetailsContent = document.getElementById('customer_details_content');
    const detailsLoading = customerDetailsContent.querySelector('#details_loading');
    const customerDetailsDisplayArea = customerDetailsContent.querySelector('#customer_details_container');
    const initialEmptyStateDiv = customerDetailsContent.querySelector('.customer-icon').parentNode;

    let selectedClienteId = null;
    let selectedCustomerName = null;

    // Function to clear customer selection highlighting and details panel
    function limpiarModal() {
        selectedClienteId = null;
        selectedCustomerName = null;
        assignBtn.disabled = true;
        searchInput.value = '';
        customersContainer.innerHTML = '';
        customersCount.style.display = 'none';
        loadingIndicator.style.display = 'none';
        noResultsMessage.style.display = 'none';

        // Reset details panel to empty state
        if (initialEmptyStateDiv) {
            initialEmptyStateDiv.style.display = 'block'; // show empty prompt & icon
        }
        if (detailsLoading) {
            detailsLoading.style.display = 'none'; // hide spinner
        }
        if (customerDetailsDisplayArea) {
            customerDetailsDisplayArea.innerHTML = '';
            customerDetailsDisplayArea.style.display = 'none';
        }
    }

    // Load customers from server and render list
    function cargarClientes() {
        loadingIndicator.style.display = 'block';
        noResultsMessage.style.display = 'none';
        customersContainer.innerHTML = '';
        customersCount.style.display = 'none';

        const term = searchInput.value.trim();
        const formData = new FormData();
        formData.append('action', 'search_customers');
        formData.append('search_term', term);

        fetch('php/sales_bar_actions/get_customers.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.text();
        })
        .then(text => {
            loadingIndicator.style.display = 'none';
            try {
                const data = JSON.parse(text);

                if (data.success && Array.isArray(data.customers) && data.customers.length > 0) {
                    customersCount.style.display = 'block';
                    customersCountText.textContent = `${data.total} cliente(s) encontrados`;

                    data.customers.forEach(cliente => {
                        const template = document.getElementById('customer_item_template').content.cloneNode(true);
                        const item = template.querySelector('.customer-item');

                        item.dataset.customerId = cliente.id;
                        item.querySelector('.customer-name').textContent = cliente.nombre_completo || 'Sin nombre';
                        item.querySelector('.contact-text').textContent = cliente.telefono || cliente.celular || 'Sin teléfono';
                        item.querySelector('.email-text').textContent = cliente.email || 'Sin email';
                        item.querySelector('.customer-type').textContent = cliente.tipo_cliente || 'Cliente general';

                        // Add click event to select this customer and show details
                        item.addEventListener('click', () => seleccionarCliente(cliente));

                        customersContainer.appendChild(item);
                    });
                } else {
                    noResultsMessage.style.display = 'block';
                    const noResultsText = noResultsMessage.querySelector('p');
                    if (noResultsText) {
                        noResultsText.textContent = data.message || 'No se encontraron clientes';
                    }
                }
            } catch(e) {
                noResultsMessage.style.display = 'block';
                const noResultsText = noResultsMessage.querySelector('p');
                if (noResultsText) {
                    noResultsText.textContent = 'Error al cargar clientes (error de parseo JSON)';
                }
            }
        })
        .catch(() => {
            loadingIndicator.style.display = 'none';
            noResultsMessage.style.display = 'block';
            const noResultsText = noResultsMessage.querySelector('p');
            if (noResultsText) {
                noResultsText.textContent = 'Error de conexión';
            }
        });
    }

    // Function to select a customer and load details
    function seleccionarCliente(cliente) {
        // Remove highlight from previously selected
        document.querySelectorAll('.customer-item').forEach(item => { item.classList.remove('selected'); });

        // Highlight selected
        const selectedItem = document.querySelector(`[data-customer-id="${cliente.id}"]`);
        if (selectedItem) selectedItem.classList.add('selected');

        selectedClienteId = cliente.id;
        selectedCustomerName = cliente.nombre_completo;
        assignBtn.disabled = false;

        // Hide initial empty state, show loading spinner, hide details container
        if (initialEmptyStateDiv) initialEmptyStateDiv.style.display = 'none';
        if (detailsLoading) detailsLoading.style.display = 'block';
        if (customerDetailsDisplayArea) {
            customerDetailsDisplayArea.style.display = 'none';
            customerDetailsDisplayArea.innerHTML = '';
        }

        const formData = new FormData();
        formData.append('action', 'get_customer_details');
        formData.append('customer_id', selectedClienteId);

        fetch('php/sales_bar_actions/get_customers.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.text();
        })
        .then(text => {
            if (detailsLoading) detailsLoading.style.display = 'none';

            try {
                const data = JSON.parse(text);

                if (data.success && data.customer) {
                    if (customerDetailsDisplayArea) {
                        customerDetailsDisplayArea.style.display = 'block';

                        const template = document.getElementById('customer_details_template').content.cloneNode(true);

                        template.querySelector('.avatar-text').textContent = data.customer.nombre_completo.charAt(0).toUpperCase();
                        template.querySelector('.customer-main-name').textContent = data.customer.nombre_completo;
                        template.querySelector('.customer-type-detail').textContent = data.customer.tipo_cliente;

                        const grid = template.querySelector('.details-grid');
                        grid.innerHTML = `
                            <div class="detail-row"><div class="detail-label">Teléfono:</div><div class="detail-value">${data.customer.telefono || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Celular:</div><div class="detail-value">${data.customer.celular || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${data.customer.email || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Dirección:</div><div class="detail-value">${data.customer.direccion || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Tipo de Cliente:</div><div class="detail-value">${data.customer.tipo_cliente || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">NIT:</div><div class="detail-value">${data.customer.nit || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">DUI:</div><div class="detail-value">${data.customer.dui || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Giro:</div><div class="detail-value">${data.customer.giro || 'No especificado'}</div></div>
                            <div class="detail-row"><div class="detail-label">Código:</div><div class="detail-value">${data.customer.codigo || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Fecha Registro:</div><div class="detail-value">${data.customer.fecha_registro_formatted || 'N/A'}</div></div>
                            <div class="detail-row"><div class="detail-label">Última Actualización:</div><div class="detail-value">${data.customer.ultima_actualizacion_formatted || 'N/A'}</div></div>
                        `;

                        customerDetailsDisplayArea.appendChild(template);
                    }
                } else {
                    if (customerDetailsDisplayArea) {
                        customerDetailsDisplayArea.style.display = 'block';
                        customerDetailsDisplayArea.innerHTML = `<div class="error-message">${data.message || 'Error al cargar detalles'}</div>`;
                    }
                }
            } catch {
                if (customerDetailsDisplayArea) {
                    customerDetailsDisplayArea.style.display = 'block';
                    customerDetailsDisplayArea.innerHTML = `<div class="error-message">Error al procesar detalles del cliente</div>`;
                }
            }
        })
        .catch(() => {
            if (customerDetailsDisplayArea) {
                customerDetailsDisplayArea.style.display = 'block';
                customerDetailsDisplayArea.innerHTML = `<div class="error-message">Error de conexión</div>`;
            }
            if (detailsLoading) detailsLoading.style.display = 'none';
        });
    }

    // Event Listeners setup
    searchBtn.addEventListener('click', cargarClientes);

    // Trigger search on Enter key
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            cargarClientes();
        }
    });

    // New Customer Modal creation (kept from second script with styling)
    const newCustomerModal = document.createElement('div');
    newCustomerModal.id = 'new-customer-form-modal';
    newCustomerModal.classList.add('customer-modal');
    newCustomerModal.innerHTML = `
        <div class="customer-modal-content">
            <div class="customer-modal-header">
                <h2>Crear Nuevo Cliente</h2>
                <span class="close-new-customer-modal">&times;</span>
            </div>
            <div class="customer-modal-body">
                <form id="new-customer-form" class="new-customer-form-grid">
                    <div class="form-group">
                        <label for="new_customer_nombre_completo">Nombre Completo:<span style="color: red;">*</span></label>
                        <input type="text" id="new_customer_nombre_completo" required>
                    </div>
                    <div class="form-group">
                        <label for="new_customer_telefono">Teléfono:</label>
                        <input type="text" id="new_customer_telefono">
                    </div>
                    <div class="form-group">
                        <label for="new_customer_celular">Celular:</label>
                        <input type="text" id="new_customer_celular">
                    </div>
                    <div class="form-group">
                        <label for="new_customer_email">Email:</label>
                        <input type="email" id="new_customer_email">
                    </div>
                    <div class="form-group full-width">
                        <label for="new_customer_direccion">Dirección:</label>
                        <input type="text" id="new_customer_direccion">
                    </div>
                    <div class="form-group">
                        <label for="new_customer_tipo_cliente">Tipo de Cliente:</label>
                        <select id="new_customer_tipo_cliente">
                            <option value="Consumidor Final">Consumidor Final</option>
                            <option value="Gran Contribuyente">Gran Contribuyente</option>
                            <option value="Pequeño Contribuyente">Pequeño Contribuyente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="new_customer_nit">NIT:</label>
                        <input type="text" id="new_customer_nit">
                    </div>
                    <div class="form-group">
                        <label for="new_customer_dui">DUI:</label>
                        <input type="text" id="new_customer_dui">
                    </div>
                    <div class="form-group full-width">
                        <label for="new_customer_giro">Giro:</label>
                        <input type="text" id="new_customer_giro">
                    </div>
                </form>
                <div id="new_customer_form_message" class="form-message" style="display:none;"></div>
            </div>
            <div class="customer-modal-footer">
                <button type="button" class="btn-cancel close-new-customer-modal">Cancelar</button>
                <button type="submit" form="new-customer-form" class="btn-assign">Guardar Cliente</button>
            </div>
        </div>
    `;
    document.body.appendChild(newCustomerModal);

    const closeNewCustomerModalBtns = newCustomerModal.querySelectorAll('.close-new-customer-modal');
    const newCustomerForm = document.getElementById('new-customer-form');
    const newCustomerFormMessage = document.getElementById('new_customer_form_message');

    // Add basic styles for new customer form
    const style = document.createElement('style');
    style.innerHTML = `
        .new-customer-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            padding: 10px;
        }
        .new-customer-form-grid .form-group {
            display: flex;
            flex-direction: column;
        }
        .new-customer-form-grid .form-group label {
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        .new-customer-form-grid .form-group input[type="text"],
        .new-customer-form-grid .form-group input[type="email"],
        .new-customer-form-grid .form-group select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .new-customer-form-grid .form-group input[type="text"]:focus,
        .new-customer-form-grid .form-group input[type="email"]:focus,
        .new-customer-form-grid .form-group select:focus {
            outline: none;
            border-color: #202C5F;
        }
        .new-customer-form-grid .full-width {
            grid-column: 1 / -1;
        }
        .form-message {
            margin-top: 15px;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
        .form-message.success {
            background-color: #d4edda;
            color: #155724;
            border-color: #c3e6cb;
        }
        .form-message.error {
            background-color: #f8d7da;
            color: #721c24;
            border-color: #f5c6cb;
        }
    `;
    document.head.appendChild(style);

    // Open new customer modal
    newCustomerBtn.addEventListener('click', () => {
        newCustomerModal.style.display = 'block';
        newCustomerForm.reset();
        newCustomerFormMessage.style.display = 'none';
        newCustomerFormMessage.textContent = '';
        document.getElementById('new_customer_nombre_completo').focus();
    });

    // Close modals handlers
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        limpiarModal();
    });
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        limpiarModal();
    });
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.style.display = 'none';
            limpiarModal();
        }
    });
    closeNewCustomerModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            newCustomerModal.style.display = 'none';
        });
    });
    newCustomerModal.addEventListener('click', e => {
        if (e.target === newCustomerModal) {
            newCustomerModal.style.display = 'none';
        }
    });

    // Assign button handler (removed loadData usage)
    assignBtn.addEventListener('click', () => {
        if (selectedClienteId && selectedCustomerName) {
            // Here, just get the active ticket without loadData
            const activeTicket = window.posStorage.getActiveTicket ? window.posStorage.getActiveTicket() : null;
            if (activeTicket) {
                activeTicket.name = selectedCustomerName;
                activeTicket.displayName = selectedCustomerName;
                activeTicket.customerId = selectedClienteId;
                // Assuming window.posStorage.saveData still accepts no argument or data internally
                if (window.posStorage.saveData) {
                    window.posStorage.saveData();
                }
                const activeTicketElement = document.querySelector('.ticket_child.active .ticket-name');
                if (activeTicketElement) {
                    activeTicketElement.textContent = selectedCustomerName;
                }
                alert(`Cliente "${selectedCustomerName}" asignado correctamente al ticket`);
            } else {
                alert('No hay ticket activo para asignar el cliente');
            }
            modal.style.display = 'none';
            limpiarModal();
        }
    });

    // Open modal from main button
    const customerAssignBtn = document.getElementById('CustomerAssing');
    if (customerAssignBtn) {
        customerAssignBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            limpiarModal();
            setTimeout(() => cargarClientes(), 100);
        });
    }

    // New customer form submit handler
    newCustomerForm.addEventListener('submit', e => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('action', 'add_customer');
        formData.set('nombre_completo', document.getElementById('new_customer_nombre_completo').value);
        formData.set('telefono', document.getElementById('new_customer_telefono').value);
        formData.set('celular', document.getElementById('new_customer_celular').value);
        formData.set('email', document.getElementById('new_customer_email').value);
        formData.set('direccion', document.getElementById('new_customer_direccion').value);
        formData.set('tipo_cliente', document.getElementById('new_customer_tipo_cliente').value);
        formData.set('nit', document.getElementById('new_customer_nit').value);
        formData.set('dui', document.getElementById('new_customer_dui').value);
        formData.set('giro', document.getElementById('new_customer_giro').value);

        newCustomerFormMessage.style.display = 'none';
        newCustomerFormMessage.classList.remove('success', 'error');

        fetch('php/sales_bar_actions/get_customers.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                newCustomerFormMessage.textContent = 'Cliente creado exitosamente.';
                newCustomerFormMessage.classList.add('success');
                newCustomerFormMessage.style.display = 'block';
                newCustomerForm.reset();
                cargarClientes();
            } else {
                newCustomerFormMessage.textContent = data.message || 'Error al crear cliente.';
                newCustomerFormMessage.classList.add('error');
                newCustomerFormMessage.style.display = 'block';
            }
        })
        .catch(() => {
            newCustomerFormMessage.textContent = 'Error de conexión al servidor.';
            newCustomerFormMessage.classList.add('error');
            newCustomerFormMessage.style.display = 'block';
        });
    });

});

