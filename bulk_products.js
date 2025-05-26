// Código para gestionar productos a granel - Versión CORREGIDA

// Esperar a que el documento esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Variable para almacenar la lista de departamentos
    let departmentsList = [];

    // Función para cargar los departamentos desde la API
    function loadDepartments() {
        console.log('Iniciando carga de departamentos...');
        
        // Crear elemento select para los departamentos si no existe
        let departmentSelect = document.getElementById('bulk_product_department');
        
        if (!departmentSelect) {
            console.error('Error: Elemento select de departamentos no encontrado.');
            return;
        }

        console.log('Elemento select encontrado:', departmentSelect);
        
        // Limpiar el select antes de cargar nuevos datos
        departmentSelect.innerHTML = '<option value="">Seleccione un departamento</option>';
        
        console.log('Solicitando departamentos a la API...');
        
        // Hacer una solicitud para obtener los departamentos
        fetch('php/sales_bar_actions/get_department.php')
        .then(response => {
            console.log('Respuesta recibida:', response);
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos de la API:', data);
            
            if (data.status === 'success' && Array.isArray(data.departments)) {
                // Guardar la lista de departamentos
                departmentsList = data.departments;
                
                console.log('Cantidad de departamentos:', departmentsList.length);
                
                // Verificar de nuevo que el select existe
                departmentSelect = document.getElementById('bulk_product_department');
                if (!departmentSelect) {
                    console.error('Error: Select perdido después de la respuesta API');
                    return;
                }
                
                // Agregar cada departamento al select
                departmentsList.forEach((dept, index) => {
                    try {
                        const option = document.createElement('option');
                        option.value = dept.Id;
                        option.textContent = dept.name_dep;
                        option.dataset.deptId = dept.Id; // Guardar también en dataset
                        option.dataset.deptName = dept.name_dep;
                        departmentSelect.appendChild(option);
                        console.log(`Departamento agregado [${index}]:`, {
                            id: dept.Id,
                            name: dept.name_dep,
                            optionValue: option.value
                        });
                    } catch (e) {
                        console.error(`Error al agregar departamento ${index}:`, e);
                    }
                });
                
                console.log('Departamentos cargados correctamente');
            } else {
                console.error('Error en formato de datos:', data);
                // Cargar departamentos estáticos como fallback
                loadStaticDepartments();
            }
        })
        .catch(error => {
            console.error('Error al cargar departamentos:', error);
            // Cargar departamentos estáticos en caso de error
            loadStaticDepartments();
        });
    }

    // Función para cargar departamentos estáticos (sin API)
    function loadStaticDepartments() {
        let departmentSelect = document.getElementById('bulk_product_department');
        
        if (!departmentSelect) {
            console.error('Error: Elemento select de departamentos no encontrado');
            return;
        }

        // Limpiar el select
        departmentSelect.innerHTML = '<option value="">Seleccione un departamento</option>';
        
        // Departamentos estáticos
        const staticDepartments = [
            {Id: '1', name_dep: 'Frutas y Verduras'},
            {Id: '2', name_dep: 'Carnes'},
            {Id: '3', name_dep: 'Lácteos'},
            {Id: '4', name_dep: 'Panadería'},
            {Id: '5', name_dep: 'Bebidas'}
        ];
        
        // Guardar la lista de departamentos
        departmentsList = staticDepartments;
        
        // Agregar cada departamento al select
        staticDepartments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.Id;
            option.textContent = dept.name_dep;
            departmentSelect.appendChild(option);
        });
        
        console.log('Departamentos estáticos cargados correctamente');
    }

    // Función para abrir el modal
    function openBulkProductModal() {
        console.log('Abriendo modal de productos a granel');
        const modal = document.getElementById('bulkProductModal');
        if (modal) {
            // Asegurarnos de que el modal sea visible
            modal.style.display = 'block';
            
            // Cargar los departamentos después de que el modal sea visible
            setTimeout(() => {
                loadDepartments();
                
                // Enfocar el primer campo al abrir el modal
                const nameInput = document.getElementById('bulk_product_name');
                if (nameInput) nameInput.focus();
            }, 100);
        } else {
            console.error('Error: Modal no encontrado');
        }
    }

    // Función para cerrar el modal
    function closeBulkProductModal() {
        const modal = document.getElementById('bulkProductModal');
        if (modal) {
            modal.style.display = 'none';
            
            // Devolver el foco al campo de código de producto
            const productCodeInput = document.getElementById('product_code');
            if (productCodeInput) productCodeInput.focus();
        }
    }

    // Configurar evento de clic para el botón de productos a granel
    const bulkButton = document.getElementById('bulk_product_button');
    if (bulkButton) {
        bulkButton.addEventListener('click', openBulkProductModal);
    } else {
        console.error('Error: Botón de producto a granel no encontrado');
    }

    // Configurar evento de clic para cerrar el modal
    const closeButton = document.getElementById('closeModal');
    if (closeButton) {
        closeButton.addEventListener('click', closeBulkProductModal);
    } else {
        console.error('Error: Botón de cerrar no encontrado');
    }

    // Función para configurar navegación entre campos con Enter
    function setupBulkProductFormNavigation() {
        // Obtener referencias a los campos del formulario
        const nameInput = document.getElementById('bulk_product_name');
        const priceInput = document.getElementById('bulk_product_price');
        const quantityInput = document.getElementById('bulk_product_quantity');
        const departmentInput = document.getElementById('bulk_product_department');
        const addButton = document.getElementById('add_bulk_product');
        
        if (!nameInput || !priceInput || !quantityInput || !addButton) {
            console.error('Error: No se encontraron todos los campos del formulario');
            return;
        }
        
        // Configurar eventos de teclado para todos los campos
        [nameInput, priceInput, quantityInput, departmentInput, addButton].filter(Boolean).forEach(element => {
            // Eliminar listeners previos clonando y reemplazando el elemento
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        });
        
        // Obtener referencias frescas
        const freshNameInput = document.getElementById('bulk_product_name');
        const freshPriceInput = document.getElementById('bulk_product_price');
        const freshQuantityInput = document.getElementById('bulk_product_quantity');
        const freshDepartmentInput = document.getElementById('bulk_product_department');
        const freshAddButton = document.getElementById('add_bulk_product');
        
        // Configurar navegación con Enter y cierre con Escape
        freshNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                freshPriceInput.focus();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeBulkProductModal();
            }
        });
        
        freshPriceInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                freshQuantityInput.focus();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeBulkProductModal();
            }
        });
        
        freshQuantityInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (freshDepartmentInput) {
                    freshDepartmentInput.focus();
                } else {
                    freshAddButton.click();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeBulkProductModal();
            }
        });
        
        // Solo configurar si el campo de departamento existe
        if (freshDepartmentInput) {
            freshDepartmentInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    freshAddButton.click();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeBulkProductModal();
                }
            });
        }
        
        freshAddButton.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeBulkProductModal();
            }
        });
        
        // Configurar el evento de agregar producto
        freshAddButton.addEventListener('click', addBulkProduct);
    }
    
    // Función para agregar un producto a granel - VERSIÓN CORREGIDA
    function addBulkProduct() {
        const nameInput = document.getElementById('bulk_product_name');
        const priceInput = document.getElementById('bulk_product_price');
        const quantityInput = document.getElementById('bulk_product_quantity');
        const departmentSelect = document.getElementById('bulk_product_department');
        
        if (!nameInput || !priceInput || !quantityInput) {
            console.error('Error: No se encontraron los campos del formulario');
            return;
        }
        
        const productName = nameInput.value.trim();
        const productPrice = parseFloat(priceInput.value);
        const productQuantity = parseInt(quantityInput.value);
        
        // Obtener tanto el ID como el nombre del departamento
        const departmentId = departmentSelect && departmentSelect.value ? 
                            departmentSelect.value : null; // NO convertir a int, dejar como string
        const departmentName = departmentSelect && departmentSelect.selectedIndex > 0 ? 
                              departmentSelect.options[departmentSelect.selectedIndex].text : null;

        // DEBUG: Verificar datos del departamento
        console.log('🏢 Datos del departamento seleccionado:', {
            departmentId: departmentId,
            departmentName: departmentName,
            selectValue: departmentSelect ? departmentSelect.value : 'NO SELECT',
            selectText: departmentSelect && departmentSelect.selectedIndex > 0 ? departmentSelect.options[departmentSelect.selectedIndex].text : 'NO TEXT'
        });

        if (productName && !isNaN(productPrice) && productQuantity > 0) {
            // Generar un código único para cada producto a granel
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            const bulkId = `BULK_${timestamp}_${random}`;
            
            console.log('🆔 Código único para producto a granel:', bulkId);
            
            // Crear objeto de producto con la estructura correcta
            const product = {
                code: bulkId,
                product: productName,
                price: productPrice,
                stock: 0, // Existencias siempre 0 para productos a granel
                original_price: productPrice,
                department_id: departmentId, // Mantener como string
                department_name: departmentName
            };

            // DEBUG: Verificar objeto del producto
            console.log('📦 Producto a granel creado:', product);

            // Verificar si ProductSystem está disponible
            if (window.ProductSystem) {
                try {
                    // Usar el método de ProductSystem para insertar el producto
                    window.ProductSystem.insertProduct(product);
                    
                    // Actualizar la cantidad después de insertar
                    setTimeout(() => {
                        // Encontrar la fila recién insertada con el código único
                        const newRow = document.querySelector(`.table_form_body .table_form_row[data-product-code="${bulkId}"]`);
                        if (newRow) {
                            const quantityCell = newRow.querySelector('[data-field="quantity"]');
                            if (quantityCell) {
                                // Actualizar el valor de cantidad
                                quantityCell.dataset.value = productQuantity;
                                quantityCell.textContent = productQuantity;
                                
                                // Forzar la actualización de cálculos
                                window.ProductSystem.updateCalculations(newRow);
                                window.ProductSystem.updateTotals();
                            }

                            // VERIFICACIÓN FINAL del dataset
                            console.log('✅ Verificación final - Dataset de la fila:', {
                                productCode: newRow.dataset.productCode,
                                departmentId: newRow.dataset.departmentId,
                                departmentName: newRow.dataset.departmentName
                            });
                        } else {
                            console.error('❌ No se encontró la fila recién insertada');
                        }
                    }, 100);
                    
                    // Limpiar los campos para el siguiente producto
                    nameInput.value = '';
                    priceInput.value = '';
                    quantityInput.value = '1';
                    if (departmentSelect) departmentSelect.selectedIndex = 0;
                    
                    // Enfocar el primer campo para el siguiente producto
                    nameInput.focus();
                    
                    console.log('✅ Producto a granel agregado exitosamente');
                    
                } catch (error) {
                    console.error('❌ Error al insertar producto:', error);
                    alert('Error al agregar el producto a la tabla');
                }
            } else {
                console.error('❌ ProductSystem no está disponible');
                alert('Error: Sistema de productos no inicializado.');
            }
            
        } else {
            console.warn('⚠️ Datos inválidos para el producto a granel:', {
                productName: productName,
                productPrice: productPrice,
                productQuantity: productQuantity
            });
            alert('Por favor, complete todos los campos correctamente.');
        }
    }

    // Configurar el atajo de teclado para abrir el modal (F2)
    document.addEventListener('keydown', function(e) {
        // Comprobar si se presiona F2 (código 113)
        if (e.key === 'F2' || e.keyCode === 113) {
            console.log('Atajo F2 detectado');
            e.preventDefault();
            openBulkProductModal();
            setTimeout(setupBulkProductFormNavigation, 100);
        }
    });

    // Si ya existe el botón de agregar producto, añadir el evento
    const addButton = document.getElementById('add_bulk_product');
    if (addButton) {
        // Eliminar posibles event listeners antiguos
        const newAddButton = addButton.cloneNode(true);
        addButton.parentNode.replaceChild(newAddButton, addButton);
        
        // Agregar el nuevo event listener
        document.getElementById('add_bulk_product').addEventListener('click', addBulkProduct);
    }

    // Inicializar la navegación cuando se abra el modal
    const bulkProductButton = document.getElementById('bulk_product_button');
    if (bulkProductButton) {
        bulkProductButton.addEventListener('click', function() {
            setTimeout(setupBulkProductFormNavigation, 100);
        });
    }
});