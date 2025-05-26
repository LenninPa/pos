<!-- Modal para productos a granel -->
<div id="bulkProductModal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <span id="closeModal" class="close">&times;</span>
      <h2>Agregar Producto a Granel</h2>
    </div>
    <div class="modal-body">
      <form id="bulk_product_form">
        <div class="form-group">
          <label for="bulk_product_name">Nombre del Producto:</label>
          <input type="text" id="bulk_product_name" placeholder="Nombre del producto">
        </div>
        <div class="form-group">
          <label for="bulk_product_price">Precio:</label>
          <input type="number" id="bulk_product_price" step="0.01" min="0" placeholder="0.00">
        </div>
        <div class="form-group">
          <label for="bulk_product_quantity">Cantidad:</label>
          <input type="number" id="bulk_product_quantity" min="1" value="1">
        </div>
        <div class="form-group">
          <label for="bulk_product_department">Departamento:</label>
          <select id="bulk_product_department">
            <option value="">Seleccione un departamento</option>
          </select>
        </div>
        <div class="form-group">
          <button type="button" id="add_bulk_product">Agregar Producto</button>
        </div>
      </form>
    </div>
  </div>
</div>
