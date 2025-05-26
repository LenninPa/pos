<div class="table">
    <ul class="table_display_header">
        <li class="table_display_header_options" id="code">Codigo<div class="column-resizer" data-index="0"></div></li>
        <li class="table_display_header_options">Producto<div class="column-resizer" data-index="1"></div></li>
        <li class="table_display_header_options">Precio<div class="column-resizer" data-index="2"></div></li>
        <li class="table_display_header_options">Cantidad<div class="column-resizer" data-index="3"></div></li>
        <li class="table_display_header_options">Subtotal<div class="column-resizer" data-index="4"></div></li>
        <li class="table_display_header_options">Existencia<div class="column-resizer" data-index="5"></div></li>
        <li class="table_display_header_options">Descuento<div class="column-resizer" data-index="6"></div></li>
    </ul>
    <div class="display_table">
        <form action="#" method="POST" class="display_table_form">
            <table>
                <tbody class="table_form_body">
                    <!-- Los productos se agregarán dinámicamente aquí -->
                </tbody>
            </table>
        </form>
    </div>
</div>

<!-- Script para el manejo de la tabla de productos -->
<script>
// Función para guardar los anchos de columnas en localStorage
function saveColumnWidths(widths) {
    localStorage.setItem('tableColumnWidths', JSON.stringify(widths));
}

// Función para cargar los anchos de columnas desde localStorage
function loadColumnWidths() {
    const savedWidths = localStorage.getItem('tableColumnWidths');
    return savedWidths ? JSON.parse(savedWidths) : null;
}

// Función para aplicar los anchos guardados
function applyColumnWidths(widths) {
    if (!widths) return;
    
    const headers = document.querySelectorAll('.table_display_header_options');
    const rows = document.querySelectorAll('.table_form_row');
    
    headers.forEach((header, index) => {
        if (widths[index]) {
            // Aplicar a los encabezados
            header.style.flex = 'none';
            header.style.width = widths[index] + 'px';
            
            // Aplicar a todas las celdas de esa columna
            rows.forEach(row => {
                const cell = row.children[index];
                if (cell) {
                    cell.style.flex = 'none';
                    cell.style.width = widths[index] + 'px';
                }
            });
        }
    });
}

// Inicializar el redimensionamiento de columnas
function initColumnResizing() {
    const resizers = document.querySelectorAll('.column-resizer');
    const headers = document.querySelectorAll('.table_display_header_options');
    let currentResizer = null;
    let startX, startWidth, columnIndex;
    
    // Establecer los anchos iniciales según la imagen de referencia
    const initialWidths = [
        180,  // Código
        null, // Producto (flexible)
        120,  // Precio
        100,  // Cantidad
        120,  // Subtotal
        100,  // Existencia
        120   // Descuento
    ];
    
    // Cargar anchos guardados o usar los iniciales
    let columnWidths = loadColumnWidths() || initialWidths;
    
    // Aplicar anchos iniciales
    applyColumnWidths(columnWidths);
    
    // Función para iniciar el redimensionamiento
    function startResize(e) {
        currentResizer = e.target;
        columnIndex = parseInt(currentResizer.getAttribute('data-index'));
        
        const header = headers[columnIndex];
        startX = e.pageX;
        startWidth = header.offsetWidth;
        
        // Añadir clase para indicar que se está redimensionando
        currentResizer.classList.add('resizing');
        
        // Añadir event listeners para el movimiento y final
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        // Prevenir selección de texto durante el resize
        e.preventDefault();
    }
    
    // Función para realizar el redimensionamiento
    function resize(e) {
        if (!currentResizer) return;
        
        const header = headers[columnIndex];
        const rows = document.querySelectorAll('.table_form_row');
        
        // Calcular el nuevo ancho
        const width = Math.max(startWidth + (e.pageX - startX), 50); // Mínimo 50px
        
        // Aplicar el nuevo ancho al encabezado
        header.style.flex = 'none';
        header.style.width = width + 'px';
        
        // Aplicar el mismo ancho a todas las celdas de esa columna
        rows.forEach(row => {
            const cell = row.children[columnIndex];
            if (cell) {
                cell.style.flex = 'none';
                cell.style.width = width + 'px';
            }
        });
        
        // Actualizar el array de anchos
        columnWidths[columnIndex] = width;
    }
    
    // Función para detener el redimensionamiento
    function stopResize() {
        if (currentResizer) {
            currentResizer.classList.remove('resizing');
            currentResizer = null;
            
            // Guardar los anchos actualizados
            saveColumnWidths(columnWidths);
            
            // Eliminar los event listeners
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }
    
    // Añadir event listeners a cada resizer
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', startResize);
    });
    
    // Devolver los anchos de columna para que puedan ser usados en otras partes
    return columnWidths;
}

// Función para establecer colores de fondo alternos en las filas
function setAlternatingRowColors() {
    const rows = document.querySelectorAll('.table_form_row');
    rows.forEach((row, index) => {
        if (index % 2 === 0) {
            row.style.backgroundColor = '#ffffff'; // Filas pares
        } else {
            row.style.backgroundColor = '#f5f5f5'; // Filas impares
        }
    });
}

// Función para establecer el color de los encabezados
function setHeaderColor() {
    const headers = document.querySelectorAll('.table_display_header_options');
    headers.forEach(header => {
        header.style.fontWeight = 'bold';
        header.style.textTransform = 'uppercase';
        header.style.padding = '8px 10px';
    });
}

// Función para alinear los datos según el tipo de columna
function alignColumnData() {
    // Alinear precio, subtotal y descuento a la derecha
    const rightAlignColumns = [2, 4, 6]; // Índices basados en 0 (precio, subtotal, descuento)
    rightAlignColumns.forEach(colIndex => {
        const cells = document.querySelectorAll(`.table_form_row_data:nth-child(${colIndex + 1})`);
        cells.forEach(cell => {
            cell.style.textAlign = 'right';
        });
    });
    
    // Alinear cantidad y existencia al centro
    const centerAlignColumns = [3, 5]; // Índices basados en 0 (cantidad, existencia)
    centerAlignColumns.forEach(colIndex => {
        const cells = document.querySelectorAll(`.table_form_row_data:nth-child(${colIndex + 1})`);
        cells.forEach(cell => {
            cell.style.textAlign = 'center';
        });
    });
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el redimensionamiento de columnas
    const columnWidths = initColumnResizing();
    
    // Aplicar estilos iniciales
    setHeaderColor();
    
    // Configurar observer para aplicar estilos cuando se agreguen nuevos elementos
    const observer = new MutationObserver(function(mutations) {
        // Alinear todas las celdas de datos
        alignColumnData();
        
        // Aplicar colores alternos a las filas
        setAlternatingRowColors();
        
        // Aplicar anchos de columna a las nuevas filas
        if (columnWidths) {
            const newRows = document.querySelectorAll('.table_form_row:not([style*="width"])');
            newRows.forEach(row => {
                Array.from(row.children).forEach((cell, index) => {
                    if (columnWidths[index]) {
                        cell.style.flex = 'none';
                        cell.style.width = columnWidths[index] + 'px';
                    }
                });
            });
        }
    });
    
    // Observar la tabla para detectar cambios
    observer.observe(document.querySelector('.table_form_body'), { 
        childList: true,
        subtree: true
    });
});
</script>