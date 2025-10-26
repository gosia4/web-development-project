import 'bootstrap';
import $ from 'jquery';
import { Html5QrcodeScanner } from 'html5-qrcode';

class ProductSearch {
  private scanner: Html5QrcodeScanner | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.searchProduct();
    });

    document.getElementById('barcodeInput')?.addEventListener('keypress', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        this.searchProduct();
      }
    });

    document.getElementById('scanBtn')?.addEventListener('click', () => {
      this.startBarcodeScanner();
    });
  }

  private searchProduct(): void {
    const input = document.getElementById('barcodeInput') as HTMLInputElement;
    const barcode = input?.value.trim() || '';
    
    if (!barcode) {
      this.showError('Please enter a barcode');
      return;
    }

    $.ajax({
      url: `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      method: 'GET',
      success: (data: any) => {
        data.status === 1
          ? this.displayProductInfo(data.product)
          : this.showError('Product not found');
      },
      error: () => this.showError('Error fetching product data')
    });
  }

  private displayProductInfo(product: any): void {
    const nutrients = product.nutriments || {};
    
    $('#productResult').html(`
      <div class="card product-card mt-4">
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${product.image_url || ''}" class="img-fluid rounded-start" alt="${product.product_name || 'Product'}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${product.product_name || 'Unknown Product'}</h5>
              <div class="row">
                <div class="col-6">
                  <p><strong>Eco-Score:</strong> ${product.ecoscore_grade || 'N/A'}</p>
                  <p><strong>Nutri-Score:</strong> ${product.nutrition_grades || 'N/A'}</p>
                  <p><strong>Calories:</strong> ${nutrients['energy-kcal'] || 'N/A'} kcal</p>
                </div>
                <div class="col-6">
                  <p><strong>Proteins:</strong> ${nutrients.proteins || 'N/A'}g</p>
                  <p><strong>Carbs:</strong> ${nutrients.carbohydrates || 'N/A'}g</p>
                  <p><strong>Fats:</strong> ${nutrients.fat || 'N/A'}g</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    
    document.getElementById('errorAlert')?.classList.add('d-none');
  }

  private showError(message: string): void {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove('d-none');
    }
    $('#productResult').empty();
  }

  private startBarcodeScanner(): void {
    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) return;

    if (this.scanner) {
      this.scanner.clear();
      this.scanner = null;
      qrReader.classList.add('d-none');
      return;
    }

    qrReader.classList.remove('d-none');
    
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
      },
      () => {}
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ProductSearch();
});