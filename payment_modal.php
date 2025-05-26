<!-- Modal para procesar pagos -->
<div id="paymentModal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <span id="closePaymentModal" class="close">&times;</span>
      <h2>Procesar Pago</h2>
    </div>
    <div class="modal-body">
      <form id="payment_form">
        <div class="form-group">
          <label for="payment_total"><b>Total a Pagar:</b></label>
          <input type="text" id="payment_total" readonly>
        </div>
        <div class="form-group">
          <label for="payment_amount"><b>Entrega:</b></label>
          <input type="number" id="payment_amount" step="0.01" min="0">
        </div>
        <div class="form-group">
          <label for="payment_change"><b>Cambio:</b></label>
          <input type="text" id="payment_change" readonly>
        </div>
        <div class="form-group buttons-container">
          <button type="button" id="cancel_payment" class="btn-cancel">Cancelar</button>
          <button type="button" id="process_payment" class="btn-process">Cobrar</button>
          <button type="button" id="process_print_payment" class="btn-print">Cobrar e Imprimir</button>
        </div>
      </form>
    </div>
  </div>
</div>