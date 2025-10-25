import 'bootstrap';
import $ from 'jquery';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Deklaracja typu dla jQuery
declare global {
  interface JQuery {
    [key: string]: any;
  }
}

class ProductSearch {
  private scanner: Html5QrcodeScanner | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Search button click
    $(document).on('click', '#searchBtn', () => {
      this.searchProduct();
    });

    // Enter key in barcode input
    $(document).on('keypress', '#barcodeInput', (e: JQuery.KeyPressEvent) => {
      if (e.key === 'Enter') {
        this.searchProduct();
      }
    });

    // Scan barcode button
    $(document).on('click', '#scanBtn', () => {
      this.startBarcodeScanner();
    });
  }

  private searchProduct(): void {
    const barcode = ($('#barcodeInput').val() as string).trim();
    
    if (!barcode) {
      this.showError('Please enter a barcode');
      return;
    }

    this.fetchProductData(barcode);
  }

  private fetchProductData(barcode: string): void {
    const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

    $.ajax({
      url: apiUrl,
      method: 'GET',
      dataType: 'json',
      success: (data: any) => {
        if (data.status === 1) {
          this.displayProductInfo(data.product);
        } else {
          this.showError('Product not found');
        }
      },
      error: (xhr: any, status: string, error: string) => {
        this.showError('Error fetching product data: ' + error);
      }
    });
  }

  private displayProductInfo(product: any): void {
    const productHtml = `
      <div class="card product-card mt-4">
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${product.image_url || ''}" class="img-fluid rounded-start" alt="${product.product_name || 'Product image'}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${product.product_name || 'Unknown Product'}</h5>
              <div class="row">
                <div class="col-6">
                  <p><strong>Eco-Score:</strong> ${product.ecoscore_grade || 'N/A'}</p>
                  <p><strong>Nutri-Score:</strong> ${product.nutrition_grades || 'N/A'}</p>
                  <p><strong>Calories:</strong> ${product.nutriments?.['energy-kcal'] || 'N/A'} kcal</p>
                </div>
                <div class="col-6">
                  <p><strong>Proteins:</strong> ${product.nutriments?.proteins || 'N/A'}g</p>
                  <p><strong>Carbs:</strong> ${product.nutriments?.carbohydrates || 'N/A'}g</p>
                  <p><strong>Fats:</strong> ${product.nutriments?.fat || 'N/A'}g</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    $('#productResult').html(productHtml);
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
    { 
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
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
    (errorMessage: string) => {
      // Błędy skanowania (można zignorować)
    }
  );
}
  // private startBarcodeScanner(): void {
  //   alert('Barcode scanner would open here. In a real implementation, this would use the device camera.');
  // }
}

// Initialize when document is ready
$(document).ready(() => {
  new ProductSearch();
});
