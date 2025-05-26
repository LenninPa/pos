/**
 * product_insert.js - Sistema de gestión de productos en la tabla de ventas
 * Versión optimizada con correcciones para department_id
 */

// Usamos un módulo IIFE para encapsular todo el código y evitar contaminación del ámbito global
(function() {
  'use strict';
  
  // Exportamos la función de actualización de totales para acceso global
  window.updateProductTotals = function() {
    if (window.ProductSystem) {
      window.ProductSystem.updateTotals();
    }
  };
  
  // Map de funciones principales organizadas por responsabilidad
  const ProductSystem = {
    // Configuración e inicialización
    init() {
      this.setupReferences();
      this.setupEventHandlers();
      this.addStyles();
      console.log('Sistema de productos inicializado');
      
      // Hacer accesible el sistema a nivel global para debugging y acceso externo
      window.ProductSystem = this;
    },
    
    // Configura las referencias a elementos DOM principales
    setupReferences() {
      this.form = document.getElementById('product_search_form');
      this.codeInput = document.getElementById('product_code');
      this.tableBody = document.querySelector('.table_form_body');
      this.selectedRow = null;
      this.isProcessing = false;
      this.DISCOUNT_DEFAULT = 0;
      this.API_PATH = "php/sales_bar_actions/get_product.php";
      
      // Intentar actualizar los totales iniciales
      setTimeout(() => this.updateTotals(), 500);
    },
    
    // Configura los manejadores de eventos centrales
    setupEventHandlers() {
      // Reemplazar el formulario para eliminar event listeners previos
      const newForm = this.form.cloneNode(true);
      this.form.parentNode?.replaceChild(newForm, this.form);
      
      // Obtener referencias frescas
      this.form = document.getElementById('product_search_form');
      this.codeInput = document.getElementById('product_code');
      
      // Manejar envío del formulario
      this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
      
      // Configurar navegación con teclado
      document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
      
      // Agregar un MutationObserver para actualizar totales cuando se modifique la tabla
      this.setupTableObserver();
      
      // Enfocar el campo de entrada
      this.codeInput.focus();
    },
    
    // Configura un observador para la tabla de productos
    setupTableObserver() {
      // Crear un observer que actualice los totales cuando se modifique la tabla
      const observer = new MutationObserver(() => {
        this.updateTotals();
      });
      
      // Configurar el observer para vigilar cambios en la tabla
      observer.observe(this.tableBody, {
        childList: true,    // Observar adición/eliminación de nodos hijos
        subtree: true,      // Observar todo el subárbol
        characterData: true // Observar cambios en el contenido de texto
      });
    },
    
    // Maneja el envío del formulario
    handleFormSubmit(event) {
      event.preventDefault();
      
      // Evitar procesamiento múltiple
      if (this.isProcessing) return;
      
      const code = this.codeInput.value.trim();
      if (!code) return;
      
      this.isProcessing = true;
      
      // Comprobar si el producto ya existe
      const existingRow = this.findProductRow(code);
      
      if (existingRow) {
        this.incrementQuantity(existingRow);
        this.codeInput.value = '';
        this.codeInput.focus();
        this.isProcessing = false;
      } else {
        this.fetchProduct(code)
          .finally(() => {
            this.isProcessing = false;
          });
      }
    },
    
    // Busca el producto en el servidor
    async fetchProduct(code) {
      try {
        const formData = new FormData();
        formData.append('code_bar', code);
        
        const response = await fetch(this.API_PATH, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Verificar nuevamente que el producto no exista ya
          if (!this.findProductRow(code)) {
            this.insertProduct(data.product);
          }
          
          this.codeInput.value = '';
          this.codeInput.focus();
        } else {
          if (data.inventory_empty) {
            alert(data.message);
          } else {
            alert(data.message || 'Error al obtener el producto');
          }
          this.codeInput.select();
        }
      } catch (error) {
        console.error('Error en la petición:', error);
        alert('Error de conexión. Por favor, intente nuevamente.');
        this.codeInput.select();
      }
    },
    
    // Busca una fila de producto por código
    findProductRow(code) {
      return [...this.tableBody.querySelectorAll('.table_form_row')]
        .find(row => row.dataset.productCode === code);
    },
    
    // Inserta un nuevo producto en la tabla - VERSIÓN CORREGIDA CON DEBUG
    insertProduct(product) {
      // Verificación final para evitar duplicados
      if (this.findProductRow(product.code)) return;
      
      // DEBUG: Verificar datos del producto recibido
      console.log('📦 Insertando producto con datos completos:', product);
      console.log('🏢 Department_id recibido:', product.department_id, typeof product.department_id);
      
      // Crear la fila
      const row = document.createElement('tr');
      row.className = 'table_form_row';
      row.dataset.productCode = product.code;

      // CORRECCIÓN: ASEGURAR QUE DEPARTMENT_ID SE GUARDE CORRECTAMENTE
      if (product.department_id) {
          row.dataset.departmentId = product.department_id;
          console.log('🏢 Department ID guardado en row dataset:', product.department_id);
      } else {
          console.warn('⚠️ Producto sin department_id:', product);
      }
      if (product.department_name) {
          row.dataset.departmentName = product.department_name;
          console.log('🏢 Department Name guardado en row:', product.department_name);
      }

      // DEBUG: Verificar dataset de la fila
      console.log('📋 Dataset de la fila creada:', {
          productCode: row.dataset.productCode,
          departmentId: row.dataset.departmentId,
          departmentName: row.dataset.departmentName
      });
      
      // Configuración inicial
      const quantity = 1;
      const subtotal = parseFloat(product.price) * quantity;
      const discountPercentage = this.DISCOUNT_DEFAULT;
      
      // Crear estructura HTML
      row.innerHTML = `
        <td class="table_form_row_data" data-field="code">${product.code}</td>
        <td class="table_form_row_data" data-field="product">${product.product}</td>
        <td class="table_form_row_data editable" data-field="price" data-original="${product.price}">${this.formatCurrency(product.price)}</td>
        <td class="table_form_row_data editable quantity" data-field="quantity" data-value="${quantity}">${quantity}</td>
        <td class="table_form_row_data" data-field="subtotal">${this.formatCurrency(subtotal)}</td>
        <td class="table_form_row_data" data-field="stock">${product.stock}</td>
        <td class="table_form_row_data" data-field="discount" data-percentage="${discountPercentage}">${discountPercentage}%</td>
      `;
      
      // Insertar al principio
      if (this.tableBody.firstChild) {
        this.tableBody.insertBefore(row, this.tableBody.firstChild);
      } else {
        this.tableBody.appendChild(row);
      }
      
      // Seleccionar la fila
      this.selectRow(row);
      
      // Añadir eventos de fila
      this.addRowEvents(row);
      
      // Actualizar los totales
      this.updateTotals();

      // DEBUG FINAL: Verificar que el dataset se mantuvo
      console.log('✅ Fila insertada con dataset final:', {
          productCode: row.dataset.productCode,
          departmentId: row.dataset.departmentId,
          departmentName: row.dataset.departmentName
      });
    },
    
    // Incrementa la cantidad de un producto existente
    incrementQuantity(row) {
      const quantityCell = row.querySelector('[data-field="quantity"]');
      let quantity = parseInt(quantityCell.dataset.value) + 1;
      
      quantityCell.textContent = quantity;
      quantityCell.dataset.value = quantity;
      
      this.updateCalculations(row);
      this.selectRow(row);
      
      // Actualizar totales
      this.updateTotals();
    },
    
    // Actualiza subtotal y descuento
    updateCalculations(row) {
      const quantityCell = row.querySelector('[data-field="quantity"]');
      const priceCell = row.querySelector('[data-field="price"]');
      const subtotalCell = row.querySelector('[data-field="subtotal"]');
      const discountCell = row.querySelector('[data-field="discount"]');
      
      const quantity = parseInt(quantityCell.dataset.value);
      const originalPrice = parseFloat(priceCell.dataset.original);
      const currentPrice = parseFloat(priceCell.textContent.replace(/[^\d.-]/g, ''));
      
      // Calcular el subtotal basado en el precio actual y la cantidad
      const subtotal = currentPrice * quantity;
      subtotalCell.textContent = this.formatCurrency(subtotal);
      
      // Calcular el porcentaje de descuento basado en la diferencia de precio
      const fullSubtotal = originalPrice * quantity;
      const discountAmount = fullSubtotal - subtotal;
      const discountPercentage = (discountAmount / fullSubtotal) * 100;
      
      // Actualizar el porcentaje de descuento, redondeando a 2 decimales
      const roundedDiscountPercentage = Math.round(discountPercentage * 100) / 100;
      discountCell.textContent = `${roundedDiscountPercentage}%`;
      discountCell.dataset.percentage = roundedDiscountPercentage;
    },
    
    // Calcula descuento
    calculateDiscount(subtotal, percentage) {
      return subtotal * (percentage / 100);
    },
    
    // Formatea moneda
    formatCurrency(value) {
      return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    },
    
    // Selecciona una fila
    selectRow(row) {
      if (this.selectedRow) {
        this.selectedRow.classList.remove('selected-row');
      }
      
      row.classList.add('selected-row');
      this.selectedRow = row;
      
      // Scroll a la fila seleccionada
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    
    // Añade eventos a una fila
    addRowEvents(row) {
      // Selección al hacer clic
      row.addEventListener('click', () => this.selectRow(row));
      
      // Configurar celdas editables
      row.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('dblclick', () => this.makeEditable(cell));
      });
    },
    
    // Hace editable una celda
    makeEditable(cell) {
      const field = cell.dataset.field;
      let originalValue;
      
      // Obtener el valor original según el tipo de campo
      if (field === 'quantity') {
        originalValue = cell.dataset.value;
      } else if (field === 'price') {
        originalValue = cell.textContent.replace(/[^\d.-]/g, '');
      } else {
        originalValue = cell.textContent;
      }
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = originalValue;
      input.className = 'editable-input';
      input.style.width = '100%';
      input.style.height = '100%';
      input.style.border = 'none';
      
      // Alineación según el tipo de campo
      if (field === 'quantity') {
        input.style.textAlign = 'center';
      } else if (field === 'price') {
        input.style.textAlign = 'right';
      }
      
      cell.textContent = '';
      cell.appendChild(input);
      input.select();
      
      const finishEdit = (save) => {
        if (save) {
          this.applyEdit(cell, input);
        } else {
          this.cancelEdit(cell, originalValue);
        }
      };
      
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          finishEdit(true);
          e.preventDefault();
        } else if (e.key === 'Escape') {
          finishEdit(false);
          e.preventDefault();
        }
      });
      
      input.addEventListener('blur', () => finishEdit(true));
    },
    
    // Aplica la edición
    applyEdit(cell, input) {
      const field = cell.dataset.field;
      const row = cell.closest('.table_form_row');
      let value = input.value.trim();
      
      if (field === 'quantity') {
        value = Math.max(1, parseInt(value) || 1);
        cell.textContent = value;
        cell.dataset.value = value;
      } else if (field === 'price') {
        // Obtener el precio original para no sobrepasarlo
        const originalPrice = parseFloat(cell.dataset.original);
        // Asegurar que sea un número positivo y no supere el precio original
        value = Math.min(originalPrice, Math.max(0, parseFloat(value) || 0));
        cell.textContent = this.formatCurrency(value);
      }
      
      this.updateCalculations(row);
      
      // Actualizar totales
      this.updateTotals();
    },
    
    // Cancela la edición
    cancelEdit(cell, originalValue) {
      const field = cell.dataset.field;
      
      if (field === 'quantity') {
        cell.textContent = originalValue;
      } else if (field === 'price') {
        cell.textContent = this.formatCurrency(originalValue);
      }
    },
    
    // NUEVA FUNCIÓN: Elimina la fila seleccionada actualmente
    // Esta función se llama cuando el usuario presiona la tecla Delete (Suprimir)
    deleteSelectedRow() {
      // Verificar que hay una fila seleccionada para eliminar
      if (!this.selectedRow) return false;
      
      // Guardar referencia a la fila que se va a eliminar
      const rowToDelete = this.selectedRow;
      
      // Obtener todas las filas actuales para poder elegir la siguiente a seleccionar
      const rows = [...this.tableBody.querySelectorAll('.table_form_row')];
      const currentIndex = rows.indexOf(rowToDelete);
      
      // Eliminar la fila del DOM
      this.tableBody.removeChild(rowToDelete);
      
      // Resetear la referencia a la fila seleccionada
      this.selectedRow = null;
      
      // Si hay más filas, seleccionar la siguiente o la anterior
      if (rows.length > 1) {
        // Si se eliminó la última fila, seleccionar la nueva última
        // Si se eliminó una fila intermedia, seleccionar la siguiente
        const newIndex = currentIndex >= rows.length - 1 ? rows.length - 2 : currentIndex;
        
        // Actualizar el array de filas después de eliminar la actual
        rows.splice(currentIndex, 1);
        
        // Seleccionar la nueva fila si existe
        if (rows[newIndex]) {
          this.selectRow(rows[newIndex]);
        }
      }
      
      // Actualizar totales después de eliminar
      this.updateTotals();
      
      // Devolver true para indicar que la operación fue exitosa
      return true;
    },
    
    // Maneja navegación con teclado - MODIFICADA PARA INCLUIR TECLA DELETE
    handleKeyboardNavigation(e) {
      // Si no hay fila seleccionada, no hacemos nada
      if (!this.selectedRow) return;
      
      // Obtener todas las filas y el índice de la seleccionada
      const rows = [...this.tableBody.querySelectorAll('.table_form_row')];
      const currentIndex = rows.indexOf(this.selectedRow);
      
      // Teclas + y -
      if (e.key === '+' || e.key === '-') {
        const quantityCell = this.selectedRow.querySelector('[data-field="quantity"]');
        let quantity = parseInt(quantityCell.dataset.value);
        
        if (e.key === '+') {
          quantity++;
        } else if (e.key === '-' && quantity > 1) {
          quantity--;
        }
        
        quantityCell.textContent = quantity;
        quantityCell.dataset.value = quantity;
        
        this.updateCalculations(this.selectedRow);
        this.updateTotals();
        e.preventDefault();
      }
      
      // Navegación con flechas
      else if (e.key === 'ArrowUp' && currentIndex > 0) {
        this.selectRow(rows[currentIndex - 1]);
        e.preventDefault();
      } 
      else if (e.key === 'ArrowDown' && currentIndex < rows.length - 1) {
        this.selectRow(rows[currentIndex + 1]);
        e.preventDefault();
      }
      
      // NUEVO: Eliminar producto con tecla Suprimir (Delete)
      else if (e.key === 'Delete') {
        // Llamar al método deleteSelectedRow para eliminar la fila actual
        if (this.deleteSelectedRow()) {
          // Si la eliminación fue exitosa, prevenir el comportamiento por defecto
          e.preventDefault();
          
          // Devolver el foco al campo de entrada principal para seguir añadiendo productos
          this.codeInput.focus();
        }
      }
    },
    
    // Actualiza los totales mostrados en el footer
    updateTotals() {
      // Obtener referencias actualizadas a los elementos del footer
      const subtotalDisplay = document.querySelector('.total_display_subtotal');
      const totalDisplay = document.querySelector('.total_display_total');
      
      if (!subtotalDisplay || !totalDisplay) {
        console.warn('No se encontraron los elementos del footer para actualizar totales');
        return;
      }
      
      // Obtener todas las filas de productos
      const rows = this.tableBody.querySelectorAll('.table_form_row');
      
      // Si no hay productos, establecer ambos a $0.00
      if (rows.length === 0) {
        subtotalDisplay.textContent = this.formatCurrency(0);
        totalDisplay.textContent = this.formatCurrency(0);
        return;
      }
      
      // Sumar directamente de la columna subtotal para el total
      let totalSubtotal = 0;
      
      // Inicializar total con precios originales para el subtotal
      let totalOriginal = 0;
      
      // Recorrer cada fila y sumar
      rows.forEach(row => {
        // Para el total, usamos directamente el valor de la columna subtotal
        const subtotalCell = row.querySelector('[data-field="subtotal"]');
        const subtotalValue = parseFloat(subtotalCell.textContent.replace(/[^\d.-]/g, ''));
        totalSubtotal += subtotalValue;
        
        // Para el subtotal, calculamos con precio original × cantidad
        const priceCell = row.querySelector('[data-field="price"]');
        const quantityCell = row.querySelector('[data-field="quantity"]');
        const originalPrice = parseFloat(priceCell.dataset.original);
        const quantity = parseInt(quantityCell.dataset.value);
        totalOriginal += originalPrice * quantity;
      });
      
      // Actualizar en el DOM con valores formateados
      subtotalDisplay.textContent = this.formatCurrency(totalOriginal);
      totalDisplay.textContent = this.formatCurrency(totalSubtotal);
      
      // Debug para verificar actualización
      console.log('Totales actualizados:', {
        subtotal: this.formatCurrency(totalOriginal),
        total: this.formatCurrency(totalSubtotal)
      });
    },
    
    // Añade estilos CSS
    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .selected-row {
          background-color: #e0f0ff !important;
          outline: 2px solid #29867E;
        }
        
        .table_form_row:hover {
          background-color: #f0f8ff;
        }
        
        .editable {
          cursor: pointer;
        }
        
        .editable:hover {
          background-color: #fffde7;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Iniciar el sistema cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    ProductSystem.init();
    
    // Esperar a que todos los componentes estén cargados antes de actualizar totales
    setTimeout(() => {
      if (window.updateProductTotals) {
        window.updateProductTotals();
      }
    }, 1000);
  });
  
  // Agregar un helper global para actualizar los totales desde cualquier parte
  window.addProductToTable = function(product) {
    if (window.ProductSystem) {
      window.ProductSystem.insertProduct(product);
    }
  };
})();