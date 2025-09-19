export class SaleModal extends window.LitElement {
  static properties = {
    isOpen: { type: Boolean },
    medicamentos: { type: Array },
    clientes: { type: Array },
    currentUserSession: { type: Object },
    apiUrl: { type: String }
  };

  static styles = window.css`
    .modal-backdrop {
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .sale-item {
      display: grid;
      grid-template-columns: 5fr 2fr 2fr 2fr 1fr;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0.5rem;
    }
    
    .grid-header {
      display: grid;
      grid-template-columns: 5fr 2fr 2fr 2fr 1fr;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: bold;
      color: #4b5563;
      margin-top: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
    }

    input, select, button {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
    }

    input:read-only {
      background-color: #f3f4f6;
    }

    .remove-item {
      background-color: transparent;
      border: none;
      color: #ef4444;
      font-weight: bold;
      cursor: pointer;
      justify-self: center;
    }

    .add-item-btn {
      background-color: #e5e7eb;
      margin-top: 0.5rem;
    }

    .confirm-btn {
      width: 100%;
      background-color: #d97706;
      color: white;
      font-weight: bold;
      margin-top: 1rem;
    }

    .total-section {
      text-align: right;
      font-weight: bold;
      font-size: 1.25rem;
      margin-top: 1rem;
    }
  `;

  constructor() {
    super();
    this.isOpen = false;
    this.medicamentos = [];
    this.clientes = [];
    this.currentUserSession = null;
    this.apiUrl = '';
    this.saleItems = [];
  }

  render() {
    if (!this.isOpen) return html``;

    return window.html`
      <div class="modal-backdrop fixed inset-0 flex items-center justify-center p-4" 
           @click="${this._handleBackdropClick}">
        <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full" 
             @click="${this._stopPropagation}">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-blue-700">Registrar Venta</h3>
            <button @click="${this.close}" 
                    class="text-gray-500 text-3xl hover:text-gray-800 border-none bg-transparent">
              &times;
            </button>
          </div>
          
          ${this._renderForm()}
        </div>
      </div>
    `;
  }

  _renderForm() {
    const clientOptions = this.clientes.map(c => 
      window.html`<option value="${c.id}">${c.nombre} ${c.apellido}</option>`
    );

    return window.html`
      <form @submit="${this._handleSubmit}" class="space-y-4">
        <select name="clienteId" class="w-full">
          <option value="">Público General</option>
          ${clientOptions}
        </select>
        
        <div class="grid-header">
          <label>Producto</label>
          <label class="text-center">Cantidad</label>
          <label class="text-center">Precio Unit.</label>
          <label class="text-center">Subtotal</label>
          <label></label>
        </div>
        
        <div id="saleItemsContainer">
          ${this.saleItems.map((item, index) => this._renderSaleItem(item, index))}
        </div>
        
        <button type="button" 
                @click="${this._addItem}" 
                class="add-item-btn">
          ➕ Añadir Producto
        </button>
        
        <div class="total-section">
          Total General: <span>$${this._calculateTotal().toFixed(2)}</span>
        </div>
        
        <button type="submit" class="confirm-btn">
          Confirmar Venta
        </button>
      </form>
    `;
  }

  _renderSaleItem(item, index) {
    const medOptions = this.medicamentos.map(m => 
      window.html`<option value="${m.id}" 
                   data-precio="${m.precio_venta}"
                   ?selected="${item.medicamento_id === m.id}">
             ${m.nombre} (${m.presentacion})
           </option>`
    );

    const selectedMed = this.medicamentos.find(m => m.id === item.medicamento_id);
    const unitPrice = selectedMed ? selectedMed.precio_venta : 0;
    const subtotal = item.cantidad * unitPrice;

    return window.html`
      <div class="sale-item">
        <select @change="${(e) => this._updateItemMedicamento(index, e)}" 
                data-index="${index}">
          <option value="">Seleccionar...</option>
          ${medOptions}
        </select>
        
        <input type="number" 
               min="1" 
               .value="${item.cantidad}" 
               @input="${(e) => this._updateItemCantidad(index, e)}"
               class="text-center" />
        
        <input type="text" 
               .value="$${unitPrice.toFixed(2)}" 
               readonly 
               class="text-center" />
        
        <input type="text" 
               .value="$${subtotal.toFixed(2)}" 
               readonly 
               class="text-center" />
        
        <button type="button" 
                @click="${() => this._removeItem(index)}" 
                class="remove-item">
          X
        </button>
      </div>
    `;
  }

  _addItem() {
    this.saleItems = [
      ...this.saleItems,
      { medicamento_id: null, cantidad: 1 }
    ];
  }

  _removeItem(index) {
    this.saleItems = this.saleItems.filter((_, i) => i !== index);
  }

  _updateItemMedicamento(index, e) {
    const medicamento_id = parseInt(e.target.value) || null;
    this.saleItems = this.saleItems.map((item, i) => 
      i === index ? { ...item, medicamento_id } : item
    );
  }

  _updateItemCantidad(index, e) {
    const cantidad = parseInt(e.target.value) || 1;
    this.saleItems = this.saleItems.map((item, i) => 
      i === index ? { ...item, cantidad } : item
    );
  }

  _calculateTotal() {
    return this.saleItems.reduce((total, item) => {
      const med = this.medicamentos.find(m => m.id === item.medicamento_id);
      const unitPrice = med ? med.precio_venta : 0;
      return total + (item.cantidad * unitPrice);
    }, 0);
  }

  async _handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clienteId = formData.get('clienteId');
    
    // Filtrar items válidos
    const validItems = this.saleItems.filter(item => 
      item.medicamento_id && item.cantidad > 0
    );

    if (validItems.length === 0) {
      alert('Debe agregar al menos un producto válido a la venta.');
      return;
    }

    const ventaData = {
      usuarioId: this.currentUserSession.user.id,
      clienteId: clienteId ? parseInt(clienteId) : null,
      items: validItems.map(item => ({
        medicamento_id: item.medicamento_id,
        cantidad: item.cantidad
      }))
    };

    try {
      const response = await fetch(`${this.apiUrl}/ventas`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${this.currentUserSession.access_token}` 
        },
        body: JSON.stringify(ventaData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        const errorDetail = JSON.parse(result.detail);
        throw new Error(errorDetail.message || 'Error desconocido.');
      }

      // Disparar evento personalizado con los datos de la venta
      this.dispatchEvent(new CustomEvent('sale-completed', {
        detail: {
          venta_id: result.venta_id,
          total: result.total_calculado
        },
        bubbles: true
      }));

      this.close();
      
    } catch (error) {
      alert(`Error al registrar la venta: ${error.message}`);
    }
  }

  _handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  _stopPropagation(e) {
    e.stopPropagation();
  }

  open() {
    this.isOpen = true;
    // Inicializar con un item vacío
    this.saleItems = [{ medicamento_id: null, cantidad: 1 }];
  }

  close() {
    this.isOpen = false;
    this.saleItems = [];
    
    // Disparar evento de cierre
    this.dispatchEvent(new CustomEvent('modal-closed', {
      bubbles: true
    }));
  }
}

// Registrar el componente
customElements.define('sale-modal', SaleModal);