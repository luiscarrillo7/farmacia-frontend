import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

export class SaleModal extends LitElement {
    static properties = {
        session: { type: Object },
        apiUrl: { type: String },
        isOpen: { type: Boolean, reflect: true },
        _medicamentos: { state: true },
        _clientes: { state: true },
    };

    static styles = css`
        :host { display: none; }
        :host([isOpen]) { display: flex; }
        .modal-backdrop {
            position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center;
        }
        .modal-content {
            background-color: white; padding: 2rem; border-radius: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 42rem;
        }
        /* Basic styles for inputs and buttons */
        input, select, button {
            padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.5rem;
            font-family: 'Inter', sans-serif;
        }
        button { cursor: pointer; }
    `;

    constructor() {
        super();
        this.isOpen = false;
        this._medicamentos = [];
        this._clientes = [];
    }

    async open() {
        try {
            const [medicamentos, clientes] = await Promise.all([
                this._apiFetch('/medicamentos'),
                this._apiFetch('/clientes')
            ]);
            this._medicamentos = medicamentos;
            this._clientes = clientes;
            this.isOpen = true;
        } catch (error) {
            alert(`Error al cargar datos para la venta: ${error.message}`);
        }
    }

    close() {
        this.isOpen = false;
    }

    render() {
        if (!this.isOpen) return html``;

        const medOptions = this._medicamentos.map(m => html`<option value="${m.id}" data-precio="${m.precio_venta}">${m.nombre} (${m.presentacion})</option>`);
        const clientOptions = this._clientes.map(c => html`<option value="${c.id}">${c.nombre} ${c.apellido}</option>`);

        return html`
            <div class="modal-backdrop" @click=${this._handleBackdropClick}>
                <div class="modal-content" @click=${(e) => e.stopPropagation()}>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="font-size:1.5rem; font-weight:bold;">Registrar Venta</h3>
                        <button @click=${this.close} style="font-size:2rem; border:none; background:none;">&times;</button>
                    </div>
                    <form @submit=${this._handleSubmit} style="display:flex; flex-direction:column; gap:1rem;">
                        <select name="clienteId" class="w-full">${clientOptions}</select>
                        <div id="items-container" style="display:flex; flex-direction:column; gap:0.5rem; border-top:1px solid #eee; padding-top:1rem;"></div>
                        <button type="button" @click=${this._addItem}>➕ Añadir Producto</button>
                        <div style="text-align:right; font-weight:bold; font-size:1.25rem;">Total: <span id="total-span">$0.00</span></div>
                        <button type="submit" style="background-color:#f59e0b; color:white; font-weight:bold;">Confirmar Venta</button>
                    </form>
                </div>
            </div>
        `;
    }

    firstUpdated() {
        this._itemsContainer = this.shadowRoot.querySelector('#items-container');
        this._totalSpan = this.shadowRoot.querySelector('#total-span');
        this._addItem();
    }
    
    _addItem() {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sale-item';
        itemDiv.style.display = 'grid';
        itemDiv.style.gridTemplateColumns = '5fr 2fr 2fr 2fr 1fr';
        itemDiv.style.gap = '0.5rem';
        itemDiv.style.alignItems = 'center';
        
        const medOptions = this._medicamentos.map(m => `<option value="${m.id}" data-precio="${m.precio_venta}">${m.nombre} (${m.presentacion})</option>`).join('');

        itemDiv.innerHTML = `
            <select name="medicamentoId" class="item-medicamento-id">${medOptions}</select>
            <input type="number" name="cantidad" class="item-cantidad" value="1" min="1">
            <input type="text" name="precio" class="item-precio" readonly>
            <input type="text" name="subtotal" class="item-subtotal" readonly>
            <button type="button" class="remove-item">X</button>
        `;
        this._itemsContainer.appendChild(itemDiv);
        itemDiv.addEventListener('change', this._updateTotals.bind(this));
        itemDiv.addEventListener('input', this._updateTotals.bind(this));
        itemDiv.querySelector('.remove-item').addEventListener('click', (e) => {
            e.currentTarget.parentElement.remove();
            this._updateTotals();
        });
        this._updateTotals();
    }

    _updateTotals() {
        let grandTotal = 0;
        this.shadowRoot.querySelectorAll('.sale-item').forEach(itemDiv => {
            const select = itemDiv.querySelector('.item-medicamento-id');
            const quantity = parseInt(itemDiv.querySelector('.item-cantidad').value) || 0;
            const unitPrice = parseFloat(select.options[select.selectedIndex]?.dataset.precio) || 0;
            
            itemDiv.querySelector('.item-precio').value = `$${unitPrice.toFixed(2)}`;
            const subtotal = quantity * unitPrice;
            itemDiv.querySelector('.item-subtotal').value = `$${subtotal.toFixed(2)}`;
            grandTotal += subtotal;
        });
        this._totalSpan.textContent = `$${grandTotal.toFixed(2)}`;
    }
    
    async _handleSubmit(e) {
        e.preventDefault();
        const items = Array.from(this.shadowRoot.querySelectorAll('.sale-item')).map(div => ({
            medicamento_id: parseInt(div.querySelector('[name=medicamentoId]').value),
            cantidad: parseInt(div.querySelector('[name=cantidad]').value)
        }));

        const ventaData = {
            usuarioId: this.session.user.id,
            clienteId: this.shadowRoot.querySelector('[name=clienteId]').value || null,
            items: items
        };

        try {
            const result = await this._apiFetch('/ventas', {
                method: 'POST',
                body: JSON.stringify(ventaData)
            });
            alert(`Venta registrada con éxito! ID: ${result.venta_id}, Total: $${result.total_calculado}`);
            this.close();
        } catch (error) {
            alert(`Error al registrar la venta: ${error.message}`);
        }
    }

    async _apiFetch(endpoint, options = {}) {
        if (!this.session) throw new Error("No estás autenticado.");
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.session.access_token}` };
        const response = await fetch(`${this.apiUrl}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
        if (!response.ok) {
            const result = await response.json();
            const errorDetail = JSON.parse(result.detail);
            throw new Error(errorDetail.message || 'Error desconocido.');
        }
        return response.json();
    }

    _handleBackdropClick(e) {
        if (e.target === this.shadowRoot.querySelector('.modal-backdrop')) {
            this.close();
        }
    }
}

customElements.define('sale-modal', SaleModal);