import 'bootstrap';
import $ from 'jquery';
import { Html5QrcodeScanner } from 'html5-qrcode';

class ProductSearch {
  private scanner: Html5QrcodeScanner | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    $('#searchBtn').on('click', () => this.searchProduct());
    $('#barcodeInput').on('keypress', (e) => {
      if (e.key === 'Enter') this.searchProduct();
    });
    $('#scanBtn').on('click', () => this.startBarcodeScanner());
  }

  private searchProduct(): void {
    const barcode = ($('#barcodeInput').val() as string).trim();
    
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
    
    $('#errorAlert').hide();
  }

  private showError(message: string): void {
    $('#errorAlert').text(message).show();
    $('#productResult').empty();
  }

  private startBarcodeScanner(): void {
    if (this.scanner) {
      this.scanner.clear();
      this.scanner = null;
      $('#qr-reader').hide();
      return;
    }

    $('#qr-reader').show();
    
    this.scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    this.scanner.render(
      (decodedText: string) => {
        $('#barcodeInput').val(decodedText);
        this.searchProduct();
        this.scanner?.clear();
        this.scanner = null;
        $('#qr-reader').hide();
      },
      (errorMessage: string) => {} // Ignoruj błędy skanowania
      
    );
  }
}

$(document).ready(() => new ProductSearch());