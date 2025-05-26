// search_products.js
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('quick_search');
    let timeout = null;

    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            const query = this.value.trim();

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (query.length >= 2) { // Mínimo 2 letras para buscar
                    fetch('php/sales_bar_actions/search_products.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: 'query=' + encodeURIComponent(query)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            showProductSearchResults(data.products);
                        } else {
                            // Puedes ocultar resultados si no hay coincidencias
                        }
                    })
                    .catch(error => console.error('Error en búsqueda en vivo:', error));
                }
            }, 300); // Espera 300ms antes de enviar la consulta
        });
    }
});
