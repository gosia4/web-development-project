class Greeter {
  private message: string;

  constructor(message: string) {
    this.message = message;
  }

  greet(): void {
    const element = document.getElementById('output');
    if (element) {
      element.innerHTML = this.message;
    }
  }
}

// Utwórz instancję i wywołaj metodę
const greeter = new Greeter('Hallo in TypeScript and SASS!');
greeter.greet();

// Dodajemy obsługę przycisku
const button = document.getElementById('clickMe');
if (button) {
  button.addEventListener('click', () => {
    alert('Button geklickt!');
  });
}

console.log('Die Applikation wurde erfolgreich geladen!');