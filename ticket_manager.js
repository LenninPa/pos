/**
 * ticket_manager.js - Sistema de gestión de tickets para POS
 * Versión MEJORADA: Con edición de nombres y procesamiento de ventas
 */

(function() {
  'use strict';
  
  // Sistema principal de tickets
  const TicketSystem = {
    // Estado del sistema
    state: {
      tickets: [],
      activeTicketId: null,
      initialized: false
    },
    
    // Elementos DOM principales
    elements: {
      ticketsContainer: null,
      addTicketBtn: null,
      productTableBody: null
    },
    
    // Configuración general
    config: {
      storageKey: 'pos_tickets_data',
      defaultTicketName: 'Ticket',
      defaultCustomerName: 'Cliente Común', // Nombre por defecto para ventas
      maxTickets: 10,
      debug: true
    },
    
    // Función de log que respeta la configuración de debug
    log(message, data) {
      if (this.config.debug) {
        if (data !== undefined) {
          console.log(`[TicketSystem] ${message}`, data);
        } else {
          console.log(`[TicketSystem] ${message}`);
        }
      }
    },
    
    // Función de log de error
    error(message, data) {
      if (data !== undefined) {
        console.error(`[TicketSystem] ERROR: ${message}`, data);
      } else {
        console.error(`[TicketSystem] ERROR: ${message}`);
      }
    },
    
    // Inicialización del sistema
    init() {
      this.log('Inicializando sistema de tickets...');
      
      if (this.state.initialized) {
        this.log('El sistema ya está inicializado');
        return;
      }
      
      this.initializeElements();
      this.setupEventListeners();
      this.loadFromStorage();
      
      this.log('Estado cargado', this.state);
      
      if (this.state.tickets.length === 0) {
        this.log('No hay tickets, creando uno por defecto');
        this.addNewTicket();
      } else {
        this.renderTickets();
        
        if (!this.state.activeTicketId && this.state.tickets.length > 0) {
          this.activateTicket(this.state.tickets[0].id, true);
        } else if (this.state.activeTicketId) {
          const ticketExists = this.state.tickets.some(t => t.id === this.state.activeTicketId);
          if (ticketExists) {
            this.activateTicket(this.state.activeTicketId, true);
          } else if (this.state.tickets.length > 0) {
            this.activateTicket(this.state.tickets[0].id, true);
          }
        }
      }
      
      this.state.initialized = true;
      window.TicketSystem = this;
      this.log('Sistema de tickets inicializado correctamente');
      
      window.addEventListener('beforeunload', () => {
        this.updateActiveTicketProducts();
        this.saveToStorage();
      });
      
      setTimeout(() => {
        this.updateActiveTicketProducts();
        this.saveToStorage();
      }, 500);
    },
    
    // Inicializa referencias a elementos DOM
    initializeElements() {
      this.elements.ticketsContainer = document.getElementById('tickets-container');
      this.elements.addTicketBtn = document.getElementById('add-ticket-btn');
      this.elements.productTableBody = document.querySelector('.table_form_body');
      
      if (!this.elements.ticketsContainer || !this.elements.addTicketBtn) {
        this.error('No se encontraron elementos DOM necesarios para el sistema de tickets');
        return;
      }
    },
    
    // Configura los event listeners
    setupEventListeners() {
      if (this.elements.addTicketBtn) {
        this.elements.addTicketBtn.addEventListener('click', () => this.addNewTicket());
      }
      
      if (this.elements.productTableBody) {
        const observer = new MutationObserver(() => {
          if (this.state.initialized) {
            this.log('Cambios detectados en la tabla de productos');
            this.updateActiveTicketProducts();
          }
        });
        
        observer.observe(this.elements.productTableBody, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true
        });
      }
    },
    
    // Crea un nuevo ID único para ticket
    generateTicketId() {
      return 'ticket_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    },
    
    // Añade un nuevo ticket
    addNewTicket() {
      if (this.state.tickets.length >= this.config.maxTickets) {
        alert(`No puedes crear más de ${this.config.maxTickets} tickets simultáneos`);
        return;
      }
      
      this.updateActiveTicketProducts();
      
      const ticketId = this.generateTicketId();
      const ticketNumber = this.state.tickets.length + 1;
      
      const newTicket = {
        id: ticketId,
        name: `${this.config.defaultTicketName} ${ticketNumber}`,
        customerName: null, // null significa que usará el nombre por defecto
        products: [],
        createdAt: new Date().toISOString()
      };
      
      this.state.tickets.push(newTicket);
      this.renderTicket(newTicket);
      this.activateTicket(ticketId, false);
      this.saveToStorage();
      
      this.log('Nuevo ticket creado', newTicket);
    },
    
    // Renderiza todos los tickets
    renderTickets() {
      if (!this.elements.ticketsContainer) return;
      
      this.elements.ticketsContainer.innerHTML = '';
      
      this.state.tickets.forEach(ticket => {
        this.renderTicket(ticket);
      });
      
      this.log(`${this.state.tickets.length} tickets renderizados`);
    },
    
    // Renderiza un único ticket
    renderTicket(ticket) {
      if (!this.elements.ticketsContainer) return;
      
      const ticketElement = document.createElement('div');
      ticketElement.className = 'ticket_child';
      ticketElement.dataset.ticketId = ticket.id;
      
      // Crear el contenedor del nombre del ticket (editable)
      const nameContainer = document.createElement('div');
      nameContainer.className = 'ticket-name-container';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'ticket-name';
      nameSpan.textContent = ticket.name;
      nameSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.startEditingTicketName(ticket.id, nameSpan);
      });
      
      nameContainer.appendChild(nameSpan);
      ticketElement.appendChild(nameContainer);
      
      // Añadir clase activa si es el ticket activo
      if (ticket.id === this.state.activeTicketId) {
        ticketElement.classList.add('active');
      }
      
      // Añadir contador de productos
      if (ticket.products && ticket.products.length > 0) {
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'product-count';
        badgeSpan.textContent = ticket.products.length;
        ticketElement.appendChild(badgeSpan);
      }
      
      // Evento de click para activar ticket
      ticketElement.addEventListener('click', () => {
        this.activateTicket(ticket.id, false);
      });
      
      // Botón para eliminar ticket
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-ticket-btn';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Eliminar ticket';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirmDeleteTicket(ticket.id);
      });
      
      // Botón para editar nombre
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-ticket-btn';
      editBtn.textContent = '✏';
      editBtn.title = 'Editar nombre del ticket';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startEditingTicketName(ticket.id, nameSpan);
      });
      
      ticketElement.appendChild(editBtn);
      ticketElement.appendChild(deleteBtn);
      this.elements.ticketsContainer.appendChild(ticketElement);
    },
    
    // Inicia la edición del nombre del ticket
    startEditingTicketName(ticketId, nameSpan) {
      const ticket = this.state.tickets.find(t => t.id === ticketId);
      if (!ticket) return;
      
      // Crear input de edición
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'ticket-name-input';
      input.value = ticket.name;
      input.maxLength = 30; // Límite razonable para nombres
      
      // Reemplazar el span con el input
      const parent = nameSpan.parentNode;
      parent.replaceChild(input, nameSpan);
      
      // Seleccionar todo el texto
      input.select();
      input.focus();
      
      // Función para guardar cambios
      const saveChanges = () => {
        const newName = input.value.trim();
        if (newName && newName !== ticket.name) {
          this.updateTicketName(ticketId, newName);
        }
        
        // Restaurar el span
        nameSpan.textContent = ticket.name;
        parent.replaceChild(nameSpan, input);
      };
      
      // Event listeners para guardar
      input.addEventListener('blur', saveChanges);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveChanges();
        } else if (e.key === 'Escape') {
          // Cancelar edición
          nameSpan.textContent = ticket.name;
          parent.replaceChild(nameSpan, input);
        }
      });
    },
    
    // Actualiza el nombre de un ticket
    updateTicketName(ticketId, newName) {
      const ticket = this.state.tickets.find(t => t.id === ticketId);
      if (!ticket) return;
      
      const oldName = ticket.name;
      ticket.name = newName;
      
      // Si el nombre es diferente al por defecto, establecer como customerName
      if (newName !== `${this.config.defaultTicketName} ${this.state.tickets.indexOf(ticket) + 1}`) {
        ticket.customerName = newName;
      } else {
        ticket.customerName = null;
      }
      
      this.log(`Nombre del ticket actualizado: "${oldName}" -> "${newName}"`);
      this.saveToStorage();
    },
    
    // Activa un ticket específico
    activateTicket(ticketId, isInitialLoad) {
      this.log(`Activando ticket: ${ticketId}, carga inicial: ${isInitialLoad}`);
      
      if (!isInitialLoad) {
        this.updateActiveTicketProducts();
      }
      
      this.state.activeTicketId = ticketId;
      
      // Actualizar clases de los tickets
      const ticketElements = this.elements.ticketsContainer.querySelectorAll('.ticket_child');
      ticketElements.forEach(el => {
        if (el.dataset.ticketId === ticketId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
      
      this.loadTicketProducts(ticketId);
      
      if (!isInitialLoad) {
        this.saveToStorage();
      }
    },
    
    // Carga productos de un ticket en la tabla
    loadTicketProducts(ticketId) {
      if (!this.elements.productTableBody) return;
      
      const ticket = this.state.tickets.find(t => t.id === ticketId);
      if (!ticket) {
        this.error(`No se encontró el ticket: ${ticketId}`);
        return;
      }
      
      this.log(`Cargando productos para ticket: ${ticket.name}, Productos: ${ticket.products ? ticket.products.length : 0}`);
      
      this.elements.productTableBody.innerHTML = '';
      
      if (!window.ProductSystem) {
        this.error('ProductSystem no está disponible para cargar productos');
        return;
      }
      
      if (ticket.products && ticket.products.length > 0) {
        const originalInitialized = this.state.initialized;
        this.state.initialized = false;
        
        ticket.products.forEach(product => {
          try {
            window.ProductSystem.insertProduct(product);
          } catch (error) {
            this.error(`Error al insertar producto ${product.code}:`, error);
          }
        });
        
        this.state.initialized = originalInitialized;
      }
    },
    
    // Actualiza los productos del ticket activo basado en la tabla
    updateActiveTicketProducts() {
      if (!this.state.activeTicketId || !this.elements.productTableBody) return;
      
      const activeTicket = this.state.tickets.find(t => t.id === this.state.activeTicketId);
      if (!activeTicket) {
        this.error('No se encontró el ticket activo al actualizar productos');
        return;
      }
      
      const products = [];
      const rows = this.elements.productTableBody.querySelectorAll('.table_form_row');
      
      if (rows.length > 0) {
        this.log(`Actualizando productos del ticket activo: ${activeTicket.name}, Filas encontradas: ${rows.length}`);
        
        rows.forEach((row, index) => {
          try {
            if (!row.dataset.productCode) {
              this.error(`Fila ${index} sin código de producto`);
              return;
            }
            
            const code = row.dataset.productCode;
            const productCell = row.querySelector('[data-field="product"]');
            const priceCell = row.querySelector('[data-field="price"]');
            const quantityCell = row.querySelector('[data-field="quantity"]');
            const discountCell = row.querySelector('[data-field="discount"]');
            const stockCell = row.querySelector('[data-field="stock"]');
            
            if (!productCell || !priceCell || !quantityCell || !discountCell || !stockCell) {
              this.error(`Fila ${index} con celdas faltantes`);
              return;
            }
            
            const product = productCell.textContent;
            const originalPrice = parseFloat(priceCell.dataset.original || '0');
            const currentPrice = parseFloat(priceCell.textContent.replace(/[^\d.-]/g, '') || '0');
            const quantity = parseInt(quantityCell.dataset.value || '1');
            const discount = parseFloat(discountCell.dataset.percentage || '0');
            const stock = parseInt(stockCell.textContent || '0');
            
            products.push({
              code: code,
              product: product,
              price: currentPrice,
              original_price: originalPrice,
              quantity: quantity,
              discount: discount,
              stock: stock
            });
          } catch (error) {
            this.error(`Error al procesar fila ${index}:`, error);
          }
        });
      } else {
        this.log(`No hay productos en la tabla para el ticket: ${activeTicket.name}`);
      }
      
      activeTicket.products = products;
      this.updateTicketProductCounters();
      this.saveToStorage();
    },
    
    // Actualiza los contadores de productos en los tickets
    updateTicketProductCounters() {
      if (!this.elements.ticketsContainer) return;
      
      const ticketElements = this.elements.ticketsContainer.querySelectorAll('.ticket_child');
      ticketElements.forEach(el => {
        const ticketId = el.dataset.ticketId;
        const ticket = this.state.tickets.find(t => t.id === ticketId);
        
        let badgeSpan = el.querySelector('.product-count');
        
        if (ticket && ticket.products && ticket.products.length > 0) {
          if (!badgeSpan) {
            badgeSpan = document.createElement('span');
            badgeSpan.className = 'product-count';
            el.appendChild(badgeSpan);
          }
          badgeSpan.textContent = ticket.products.length;
        } else if (badgeSpan) {
          el.removeChild(badgeSpan);
        }
      });
    },
    
    // Confirma la eliminación de un ticket
    confirmDeleteTicket(ticketId) {
      const ticket = this.state.tickets.find(t => t.id === ticketId);
      if (!ticket) return;
      
      if (ticket.products && ticket.products.length > 0) {
        if (!confirm(`¿Está seguro de eliminar "${ticket.name}" con ${ticket.products.length} productos?`)) {
          return;
        }
      }
      
      this.deleteTicket(ticketId);
    },
    
    // Elimina un ticket
    deleteTicket(ticketId) {
      this.log(`Eliminando ticket: ${ticketId}`);
      
      this.state.tickets = this.state.tickets.filter(t => t.id !== ticketId);
      
      if (this.state.activeTicketId === ticketId) {
        if (this.state.tickets.length > 0) {
          this.activateTicket(this.state.tickets[0].id, false);
        } else {
          if (this.elements.productTableBody) {
            this.elements.productTableBody.innerHTML = '';
          }
          this.state.activeTicketId = null;
          this.addNewTicket();
        }
      }
      
      this.renderTickets();
      this.saveToStorage();
    },
    
    // Obtiene el nombre del cliente para procesar la venta
    getCustomerNameForSale() {
      if (!this.state.activeTicketId) {
        return this.config.defaultCustomerName;
      }
      
      const activeTicket = this.state.tickets.find(t => t.id === this.state.activeTicketId);
      if (!activeTicket) {
        return this.config.defaultCustomerName;
      }
      
      // Si customerName está establecido, usarlo; sino usar el por defecto
      return activeTicket.customerName || this.config.defaultCustomerName;
    },
    
    // Procesa la venta actual (función para integrar con tu sistema de ventas)
    processSale(saleData = {}) {
      const customerName = this.getCustomerNameForSale();
      const activeTicket = this.state.tickets.find(t => t.id === this.state.activeTicketId);
      
      if (!activeTicket || !activeTicket.products || activeTicket.products.length === 0) {
        this.error('No hay productos en el ticket activo para procesar la venta');
        return null;
      }
      
      // Crear objeto de venta con el nombre del cliente
      const saleObject = {
        ticket_name: customerName,
        ticket_id: activeTicket.id,
        products: activeTicket.products,
        created_at: new Date().toISOString(),
        ...saleData // Permitir datos adicionales
      };
      
      this.log('Procesando venta:', saleObject);
      
      return saleObject;
    },
    
    // Guarda el estado actual en localStorage
    saveToStorage() {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
        this.log(`Estado guardado en localStorage. Tickets: ${this.state.tickets.length}`);
      } catch (e) {
        this.error('Error al guardar tickets en localStorage:', e);
      }
    },
    
    // Carga el estado desde localStorage
    loadFromStorage() {
      try {
        const savedData = localStorage.getItem(this.config.storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Formato de datos inválido');
          }
          
          this.state = parsedData;
          this.log(`Estado cargado desde localStorage. Tickets: ${this.state.tickets ? this.state.tickets.length : 0}`);
          
          if (!Array.isArray(this.state.tickets)) {
            this.error('Datos inválidos: tickets no es un array');
            this.state.tickets = [];
          }
          
          this.state.tickets.forEach(ticket => {
            if (!Array.isArray(ticket.products)) {
              this.log(`Ticket sin array de productos: ${ticket.id}`);
              ticket.products = [];
            }
            // Asegurar que customerName existe como propiedad
            if (ticket.customerName === undefined) {
              ticket.customerName = null;
            }
          });
          
          this.state.initialized = false;
        } else {
          this.log('No se encontraron datos en localStorage');
          this.state = {
            tickets: [],
            activeTicketId: null,
            initialized: false
          };
        }
      } catch (e) {
        this.error('Error al cargar tickets desde localStorage:', e);
        this.state = {
          tickets: [],
          activeTicketId: null,
          initialized: false
        };
      }
    },
    
    // Añade estilos CSS para los tickets
    addStyles() {
      if (document.getElementById('ticket-system-styles')) {
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'ticket-system-styles';
      style.textContent = `
        /* Estilos para el contenedor del nombre del ticket */
        .ticket-name-container {
          flex: 1;
          overflow: hidden;
        }
        
        .ticket-name {
          display: block;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background-color 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color:white;
        }
        
        .ticket-name:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .ticket-name-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ccc;
          border-radius: 3px;
          padding: 2px 4px;
          font-size: inherit;
          font-family: inherit;
          color: #333;
        }
        
        .ticket-name-input:focus {
          outline: none;
          border-color: #29867E;
          box-shadow: 0 0 3px rgba(41, 134, 126, 0.3);
        }
        
        /* Estilos para el contador de productos */
        .product-count {
          background-color: #ff6b6b;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 0.8em;
          margin-left: 5px;
          display: inline-block;
          min-width: 18px;
          text-align: center;
        }
        
        .ticket_child.active .product-count {
          background-color: white;
          color: #29867E;
        }
        
        /* Estilos para los botones */
        .edit-ticket-btn,
        .delete-ticket-btn {
          background: none;
          border: none;
          color: inherit;
          font-size: 1em;
          cursor: pointer;
          margin-left: 3px;
          opacity: 0.7;
          transition: opacity 0.2s;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .edit-ticket-btn:hover {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .delete-ticket-btn:hover {
          opacity: 1;
          color: #FF2A2A;
          background-color: rgba(255, 42, 42, 0.1);
        }
        
        /* Ajustar el layout del ticket */
        .ticket_child {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
        }
        
        /* Tooltip para indicar la función de doble click */
        .ticket-name[title=""]::after {
          content: "Doble click para editar";
        }
      `;
      document.head.appendChild(style);
    }
  };
  
  // Inicializar el sistema cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    TicketSystem.addStyles();
    
    const waitForProductSystem = setInterval(() => {
      if (window.ProductSystem) {
        clearInterval(waitForProductSystem);
        TicketSystem.init();
      }
    }, 100);
    
    setTimeout(() => {
      clearInterval(waitForProductSystem);
      if (!window.ProductSystem) {
        console.warn('ProductSystem no disponible después de 3 segundos, inicializando TicketSystem de todos modos');
        TicketSystem.init();
      }
    }, 3000);
  });
  
  // API pública mejorada para uso externo
  window.manageTickets = {
    /**
     * Añade un nuevo ticket vacío
     */
    addNewTicket: function() {
      if (window.TicketSystem) {
        window.TicketSystem.addNewTicket();
      }
    },
    
    /**
     * Elimina el ticket activo
     */
    deleteActiveTicket: function() {
      if (window.TicketSystem && window.TicketSystem.state.activeTicketId) {
        window.TicketSystem.deleteTicket(window.TicketSystem.state.activeTicketId);
      }
    },
    
    /**
     * Cambia el nombre del ticket activo
     */
    renameActiveTicket: function(newName) {
      if (window.TicketSystem && window.TicketSystem.state.activeTicketId) {
        window.TicketSystem.updateTicketName(window.TicketSystem.state.activeTicketId, newName);
        window.TicketSystem.renderTickets();
      }
    },
    
    /**
     * Obtiene datos del ticket activo
     */
    getActiveTicketData: function() {
      if (window.TicketSystem && window.TicketSystem.state.activeTicketId) {
        return window.TicketSystem.state.tickets.find(
          t => t.id === window.TicketSystem.state.activeTicketId
        );
      }
      return null;
    },
    
    /**
     * Obtiene el nombre del cliente para la venta
     */
    getCustomerName: function() {
      if (window. TicketSystem) {
        return window.TicketSystem.getCustomerNameForSale();
      }
      return 'Cliente Común';
    },
    
    /**
     * Procesa la venta actual y retorna el objeto con ticket_name
     */
    processSale: function(additionalData = {}) {
      if (window.TicketSystem) {
        return window.TicketSystem.processSale(additionalData);
      }
      return null;
    },
    
    /**
     * Fuerza la actualización de todos los tickets
     */
    forceUpdate: function() {
      if (window.TicketSystem) {
        window.TicketSystem.updateActiveTicketProducts();
        window.TicketSystem.saveToStorage();
        return true;
      }
      return false;
    },
    
    /**
     * Reinicia completamente el sistema de tickets
     */
    resetSystem: function() {
      if (confirm('¿Está seguro de reiniciar el sistema de tickets? Se perderán todos los datos.')) {
        localStorage.removeItem('pos_tickets_data');
        location.reload();
      }
    }
  };
})();