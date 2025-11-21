import 'bootstrap';
import $ from 'jquery';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Chart, registerables } from 'chart.js';
// import { io } from "socket.io-client";
import io from "socket.io-client";

declare const bootstrap: any;




Chart.register(...registerables);

declare global {
  interface JQuery {
    collapse(action?: string): JQuery;
  }
}

class ProductSearch {
  private scanner: Html5QrcodeScanner | null = null;
  private socket = io();
  private nutriScoreChart: Chart | null = null;
  private lastFoundProduct: any | null = null;
  private searchButton: HTMLElement | null;

  constructor() {
    this.searchButton = document.getElementById('searchBtn');
    this.initializeEventListeners();
    this.initializeSocketListeners();
    this.updateNutriScoreChart();
    this.updateScanHistory();
  }

  private initializeEventListeners(): void {
    // this.searchButton?.addEventListener('click', () => {
    //   if (this.searchButton?.textContent === 'Add to My Scans') {
    //     this.addProductToMyDatabase();
    //   } else {
    //     this.searchProduct();
    //   }
    // });

    // document.getElementById('barcodeInput')?.addEventListener('keypress', (e) => {
    //   if ((e as KeyboardEvent).key === 'Enter') {
    //     if (this.searchButton?.textContent === 'Add to My Scans') {
    //       this.addProductToMyDatabase();
    //     } else {
    //       this.searchProduct();
    //     }
    //   }
    // });
    this.searchButton?.addEventListener('click', () => {
    this.searchProduct(); // zawsze tylko search
    });
    document.getElementById('barcodeInput')?.addEventListener('keypress', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
            this.searchProduct(); // zawsze tylko search
        }
    });


    document.getElementById('scanBtn')?.addEventListener('click', () => {
      this.toggleBarcodeScanner();
    });
  }

  private initializeSocketListeners(): void {
    this.socket.on('connect', () => console.log('Connected to WebSocket server'));
    this.socket.on('disconnect', () => console.log('Disconnected from WebSocket server'));
    this.socket.on('newScanItem', (item: any) => {
      this.updateNutriScoreChart();
      this.updateScanHistory();
    });
  }

  private toggleBarcodeScanner(): void {
    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) return;

    if (this.scanner) {
      this.scanner.clear();
      this.scanner = null;
      qrReader.classList.add('d-none');
      if (this.searchButton) this.searchButton.classList.remove('disabled');
      document.getElementById('scanBtn')!.textContent = 'Scan Barcode';
      return;
    }

    qrReader.classList.remove('d-none');
    document.getElementById('scanBtn')!.textContent = 'Stop Scanning';
    if (this.searchButton) this.searchButton.classList.add('disabled');

    this.scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    this.scanner.render(
      (decodedText: string) => {
        const input = document.getElementById('barcodeInput') as HTMLInputElement;
        if (input) input.value = decodedText;
        this.searchProduct();
        this.scanner?.clear();
        this.scanner = null;
        qrReader.classList.add('d-none');
        document.getElementById('scanBtn')!.textContent = 'Scan Barcode';
        if (this.searchButton) this.searchButton.classList.remove('disabled');
      },
      () => {}
    );
  }

  private async searchProduct(): Promise<void> {
    const barcode = (document.getElementById('barcodeInput') as HTMLInputElement).value.trim();
    if (!barcode) { this.showError('Please enter a barcode'); return; }

    this.showError('');
    this.lastFoundProduct = null;
    if (this.searchButton) this.searchButton.textContent = 'Searching...';

    try {
      const res = await $.ajax({
        url: `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        method: 'GET'
      });
          console.log('Full product object:', res.product);
    console.log('Nutriments:', res.product.nutriments);

      if (res.status === 1 && res.product) {
          this.displayProductInfo(res.product);
          this.lastFoundProduct = this.mapOpenFoodFactsProductToScanItem(res.product);
          if (this.searchButton) {
              this.searchButton.textContent = 'Search';
              this.searchButton.classList.remove('btn-success', 'disabled');
              this.searchButton.classList.add('btn-outline-secondary');
          }
      }
      else {
              this.showError('Product not found');
            }
          } catch {
            this.showError('Error fetching product data');
          }

        }

  private displayProductInfo(product: any): void {
    const nutrients = product.nutriments || {};
  $('#productResult').html(`
    <div class="card product-card mt-4 p-3">
      <div class="row g-0">
        <div class="col-md-4">
          <img src="${product.image_url || 'https://via.placeholder.com/150'}" 
              class="img-fluid rounded" alt="${product.product_name || 'Product'}">
        </div>
        <div class="col-md-8 ps-3">
          <h5>${product.product_name || 'Unknown'}</h5>
          <p><strong>NutriScore:</strong> ${product.nutriscore_grade?.toUpperCase() || 'N/A'}</p>
          <p><strong>EcoScore:</strong> ${product.ecoscore_grade?.toUpperCase() || 'N/A'}</p>
          <p><strong>Calories:</strong> ${nutrients['energy-kcal_100g'] || 'N/A'} kcal</p>
          <button class="btn btn-success mt-2 w-100" id="addItemBtn">Add item</button>
        </div>
      </div>
    </div>
  `);
  document.getElementById("addItemBtn")?.addEventListener("click", () => {
    this.addProductToMyDatabase();
});


    this.showError('');
  }

  private showError(msg: string) {
    const el = document.getElementById('errorAlert');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('d-none', !msg);
  }

  private mapOpenFoodFactsProductToScanItem(product: any) {
  const nutrients = product.nutriments || {};

  const pick = (...keys: (string | number)[]) => {
    for (const k of keys) {
      if (k in nutrients && nutrients[k] !== null && nutrients[k] !== undefined) {
        const val = nutrients[k];

        // 🔥 KONWERSJA NA NUMER
        const num = Number(val);
        return isNaN(num) ? null : num;
      }
    }
    return null;
  };

  return {
    name: product.product_name || 'UNKNOWN',
    ean: product.code || 'UNKNOWN',
    ecoScoreCategory: (product.ecoscore_grade || product.ecoscore)
      ? (product.ecoscore_grade || product.ecoscore).toString().toUpperCase()
      : 'UNKNOWN',
    nutriScoreCategory: (product.nutriscore_grade || product.nutriscore)
      ? (product.nutriscore_grade || product.nutriscore).toString().toUpperCase()
      : 'UNKNOWN',
    content: product.ingredients_text || product.ingredients_text_en || 'UNKNOWN',

    nutrition: [
      { name: 'fat', value: pick('fat_100g', 'fat_value', 'fat') },
      { name: 'sugar', value: pick('sugars_100g', 'sugars_value', 'sugars') },
      { name: 'protein', value: pick('proteins_100g', 'proteins_value', 'proteins') },
      { name: 'carbohydrates', value: pick('carbohydrates_100g', 'carbohydrates_value', 'carbohydrates') }
    ]
  };
}



  private async addProductToMyDatabase() {
    if (!this.lastFoundProduct) return alert('No product found');

    if (this.searchButton) {
      this.searchButton.textContent = 'Adding...';
      this.searchButton.classList.add('disabled');
    }

    try {
      const res = await fetch('/api/scanItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.lastFoundProduct)
      });
      if (!res.ok) throw new Error('Failed to add product');
      const newItem = await res.json();
      alert(`"${newItem.name}" added to scanned items!`);
      this.resetSearchUI();
    } catch (e: any) {
      this.showError(e.message);
    }
  }

  private resetSearchUI() {
    (document.getElementById('barcodeInput') as HTMLInputElement).value = '';
    $('#productResult').empty();
    this.showError('');
    this.lastFoundProduct = null;
    if (this.searchButton) {
      this.searchButton.textContent = 'Search';
      this.searchButton.classList.remove('btn-success', 'disabled');
      this.searchButton.classList.add('btn-outline-secondary');
    }
  }

  // --- Funkcje wykresu i historii ---
  private async updateNutriScoreChart() {
  try {
    const res = await fetch('/api/nutritionScore/average');
    const data = await res.json();

    const labels = data.map((d: any) => d.category || 'UNKNOWN');
    const counts = data.map((d: any) => d.count || 0);

    const ctx = document.getElementById('nutriScoreChart') as HTMLCanvasElement;

    if (!ctx) return;

    if (this.nutriScoreChart) {
      this.nutriScoreChart.destroy();
    }

    this.nutriScoreChart = new Chart(ctx, {
      type: 'pie',
        data: {
          labels,
          datasets: [{
            data: counts,
            backgroundColor: [
              '#ff6384',
              '#36a2eb',
              '#ffcd56',
              '#4bc0c0',
              '#9966ff',
            ]
          }]
        },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  } catch (err) {
    console.error('Error loading NutriScore chart:', err);
  }
}

  private async updateScanHistory() {
  try {
    const res = await fetch('/api/scanItem');
    if (!res.ok) throw new Error('Cannot load scan items');

    const items = await res.json();

    const container = document.getElementById('scannedItems');
    const noHistory = document.getElementById('noHistoryText');

    if (!container || !noHistory) return;

    container.innerHTML = '';

    if (items.length === 0) {
      noHistory.classList.remove('d-none');
      return;
    }

    noHistory.classList.add('d-none');

items.forEach((item: any) => {
  const div = document.createElement('div');

  // 🔥 TUTAJ dodajesz wygląd card — zamiast list-group-item
  div.classList.add('card', 'mb-2', 'p-3');

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <strong>${item.name}</strong><br>
        <small>Barcode: ${item.ean}</small><br>
        <small>Scanned on: ${new Date(item.createdAt).toLocaleString()}</small>
      </div>
      <button class="btn btn-outline-primary btn-sm view-details-btn">View Details</button>
    </div>
  `;

div.querySelector(".view-details-btn")!.addEventListener("click", () => {
  const content = document.getElementById("detailsContent");
  if (content) {
    content.innerHTML = `
      <p><strong>Name:</strong> ${item.name}</p>
      <p><strong>EAN:</strong> ${item.ean}</p>
      <p><strong>EcoScore:</strong> ${item.ecoScoreCategory}</p>
      <p><strong>NutriScore:</strong> ${item.nutriScoreCategory}</p>
      <p><strong>Ingredients:</strong> ${item.content}</p>
      <h6>Nutrition:</h6>
      <ul>
        ${item.nutrition.map((n: any, i: number) => {
  const label = ['Fat','Sugar','Protein','Carbs'][i] ?? n.name;
  const value = (n.value === null || n.value === undefined || n.value === -1) ? 'N/A' : n.value;
  return `<li>${label}: ${value}${(value !== 'N/A' && typeof value === 'number') ? ' g/100g' : ''}</li>`;
}).join('')}

      </ul>
    `;
  }

  const modalEl = document.getElementById("detailsModal");
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
});




  container.appendChild(div);
});

  } catch (err) {
    console.error('Error loading scan history:', err);
  }
}

}

document.addEventListener('DOMContentLoaded', () => new ProductSearch());
