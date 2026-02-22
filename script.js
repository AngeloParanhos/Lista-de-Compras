const blockInput = document.getElementById('block-input');
const createBlockBtn = document.getElementById('create-block-btn');
const blocsContainer = document.getElementById('blocos-container');

// Ativar/desativar modo dark
const themeBtn = document.getElementById('theme-toggle');

function salvarTema() {
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('tema', 'dark');
    } else {
        localStorage.setItem('tema', 'claro');
    }
}

function carregarTema() {
    const tema = localStorage.getItem('tema');
    if (tema === 'dark') {
        document.body.classList.add('dark-mode');
        themeBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeBtn.textContent = '🌙';
    }
}

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        themeBtn.textContent = '☀️';
    } else {
        themeBtn.textContent = '🌙';
    }
    
    salvarTema();
});

let itemCounter = 0;

// ========== FUNÇÕES DE PERSISTÊNCIA ==========
function salvarDados() {
    const blocos = [];
    
    blocsContainer.querySelectorAll('.bloco').forEach(blocoDiv => {
        const title = blocoDiv.querySelector('.bloco-header h2').textContent;
        const isFavoritos = blocoDiv.classList.contains('bloco-favoritos');
        const items = [];
        
        blocoDiv.querySelectorAll('.bloco-lista > li').forEach(li => {
            items.push({
                texto: li.dataset.itemText || li.querySelector('.item-text').textContent,
                checked: li.classList.contains('checked'),
                priority: li.classList.contains('priority'),
                itemId: li.dataset.itemId
            });
        });
        
        blocos.push({
            nome: title,
            isFavoritos: isFavoritos,
            items: items
        });
    });
    
    localStorage.setItem('listaCompras', JSON.stringify(blocos));
}

function carregarDados() {
    const dados = localStorage.getItem('listaCompras');
    if (!dados) return null;
    
    try {
        return JSON.parse(dados);
    } catch (e) {
        return null;
    }
}

function reconstruirDadosSalvos() {
    const dados = carregarDados();
    if (!dados || dados.length === 0) return false;
    
    dados.forEach(blocoData => {
        const novoBloco = criarBloco(blocoData.nome, blocoData.isFavoritos, true);
        
        if (blocoData.items && blocoData.items.length > 0) {
            const blocoLista = novoBloco.querySelector('.bloco-lista');
            
            blocoData.items.forEach(itemData => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="item-content">
                        <span class="item-text">${itemData.texto}</span>
                        <div class="item-buttons">
                            ${!blocoData.isFavoritos ? '<button type="button" class="priority-btn">⭐</button>' : '<button type="button" class="remove-fav-btn">❌</button>'}
                            <button type="button" class="delete-btn">🗑️</button>
                        </div>
                    </div>
                `;
                
                li.dataset.itemId = itemData.itemId;
                li.dataset.itemText = itemData.texto;
                li.dataset.blocoOrigem = blocoData.nome;
                
                if (itemData.checked) li.classList.add('checked');
                if (itemData.priority) li.classList.add('priority');
                
                // Event listeners para item carregado
                const itemText = li.querySelector('.item-text');
                itemText.addEventListener('click', function(e) {
                    e.stopPropagation();
                    li.classList.toggle('checked');
                    sincronizarItem(itemData.itemId, li.classList.contains('checked'));
                    salvarDados();
                });
                
                if (!blocoData.isFavoritos) {
                    const priorityBtn = li.querySelector('.priority-btn');
                    priorityBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        li.classList.toggle('priority');
                        
                        if (li.classList.contains('priority')) {
                            let blocoFav = obterBlocoFavoritos();
                            if (!blocoFav) {
                                blocoFav = criarBlocoFavoritos();
                            }
                            adicionarAFavoritos(itemData.itemId, itemData.texto, blocoFav, blocoData.nome, li);
                        } else {
                            removerDeFavoritos(itemData.itemId);
                        }
                        salvarDados();
                    });
                } else {
                    const removeFavBtn = li.querySelector('.remove-fav-btn');
                    removeFavBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        li.remove();
                        salvarDados();
                    });
                    
                    itemText.addEventListener('click', function(e) {
                        e.stopPropagation();
                        li.classList.toggle('checked');
                        // Sincronizar com item original
                        const itemOriginal = document.querySelector(`li[data-item-id="${itemData.itemId}"]:not(.bloco-favoritos *)`);
                        if (itemOriginal) {
                            if (li.classList.contains('checked')) {
                                itemOriginal.classList.add('checked');
                            } else {
                                itemOriginal.classList.remove('checked');
                            }
                        }
                        salvarDados();
                    });
                }
                
                const deleteBtn = li.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (li.classList.contains('priority')) {
                        removerDeFavoritos(itemData.itemId);
                    }
                    li.remove();
                    salvarDados();
                });
                
                blocoLista.appendChild(li);
            });
        }
    });
    
    return true;
}

function obterBlocoFavoritos() {
    for (let bloco of blocsContainer.querySelectorAll('.bloco')) {
        const title = bloco.querySelector('.bloco-header h2').textContent;
        if (title === 'Favoritos') {
            return bloco;
        }
    }
    return null;
}

function criarBlocoFavoritos() {
    const blocoFav = criarBloco('Favoritos', true, false);
    return blocoFav;
}

function criarBloco(nomeBLoco, isFavoritos = false, carregandoDados = false) {
    if (nomeBLoco.trim() === '') return;

    const blocoDiv = document.createElement('div');
    blocoDiv.className = 'bloco';
    if (isFavoritos) blocoDiv.classList.add('bloco-favoritos');
    blocoDiv.innerHTML = `
        <div class="bloco-header">
            <h2>${nomeBLoco}</h2>
            <button type="button" class="delete-block-btn">🗑️</button>
        </div>
        <div class="input-area" ${isFavoritos ? 'style="display: none;"' : ''}>
            <input type="text" class="item-input" placeholder="Adicionar item...">
            <button type="button" class="add-btn">Adicionar</button>
        </div>
        <ul class="bloco-lista"></ul>
    `;

    // Botão de deletar bloco
    blocoDiv.querySelector('.delete-block-btn').addEventListener('click', function(e) {
        e.preventDefault();
        if (isFavoritos) {
            blocsContainer.querySelectorAll('li.priority').forEach(item => {
                item.classList.remove('priority');
            });
        }
        blocoDiv.remove();
        salvarDados();
    });

    // Input e botão de adicionar item no bloco (não aparece em Favoritos)
    if (!isFavoritos) {
        const itemInputBloco = blocoDiv.querySelector('.item-input');
        const addBtnBloco = blocoDiv.querySelector('.add-btn');
        const blocoLista = blocoDiv.querySelector('.bloco-lista');

        function adicionarItemAoBloco() {
            if (itemInputBloco.value.trim() === '') return;

            const li = document.createElement('li');
            const itemText = itemInputBloco.value;
            const itemId = 'item-' + (++itemCounter);

            li.innerHTML = `
                <div class="item-content">
                    <span class="item-text">${itemText}</span>
                    <div class="item-buttons">
                        <button type="button" class="priority-btn">⭐</button>
                        <button type="button" class="delete-btn">🗑️</button>
                    </div>
                </div>
            `;
            
            li.dataset.itemId = itemId;
            li.dataset.itemText = itemText;
            li.dataset.blocoOrigem = nomeBLoco;

            // Marcar/Desmarcar ao clicar no texto
            li.querySelector('.item-text').addEventListener('click', function(e) {
                e.stopPropagation();
                li.classList.toggle('checked');
                sincronizarItem(itemId, li.classList.contains('checked'));
                salvarDados();
            });

            // Botão de prioritário
            li.querySelector('.priority-btn').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                li.classList.toggle('priority');
                
                if (li.classList.contains('priority')) {
                    let blocoFav = obterBlocoFavoritos();
                    if (!blocoFav) {
                        blocoFav = criarBlocoFavoritos();
                    }
                    adicionarAFavoritos(itemId, itemText, blocoFav, nomeBLoco, li);
                } else {
                    removerDeFavoritos(itemId);
                }
                salvarDados();
            });

            // Botão de excluir
            li.querySelector('.delete-btn').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (li.classList.contains('priority')) {
                    removerDeFavoritos(itemId);
                }
                li.remove();
                salvarDados();
            });

            blocoLista.appendChild(li);
            itemInputBloco.value = '';
            salvarDados();
        }

        addBtnBloco.addEventListener('click', function(e) {
            e.preventDefault();
            adicionarItemAoBloco();
        });

        itemInputBloco.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                adicionarItemAoBloco();
            }
        });
    }

    if (isFavoritos) {
        const blocoLista = blocoDiv.querySelector('.bloco-lista');
        blocoLista.dataset.isFavoritos = 'true';
    }

    blocsContainer.appendChild(blocoDiv);
    blockInput.value = '';
    
    if (!carregandoDados) {
        salvarDados();
    }
    
    return blocoDiv;
}

function adicionarAFavoritos(itemId, itemText, blocoFav, blocoOrigem, itemOriginal) {
    const blocoLista = blocoFav.querySelector('.bloco-lista');
    
    if (blocoLista.querySelector(`li[data-item-id="${itemId}"]`)) return;
    
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="item-content">
            <span class="item-text">${itemText}</span>
            <div class="item-buttons">
                <button type="button" class="remove-fav-btn">❌</button>
            </div>
        </div>
    `;
    
    li.dataset.itemId = itemId;
    li.dataset.itemText = itemText;
    li.dataset.blocoOrigem = blocoOrigem;

    // Marcar/Desmarcar ao clicar no texto
    li.querySelector('.item-text').addEventListener('click', function(e) {
        e.stopPropagation();
        li.classList.toggle('checked');
        if (itemOriginal) {
            if (li.classList.contains('checked')) {
                itemOriginal.classList.add('checked');
            } else {
                itemOriginal.classList.remove('checked');
            }
        }
        salvarDados();
    });

    // Botão de remover de favoritos
    li.querySelector('.remove-fav-btn').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        li.remove();
        if (itemOriginal) {
            itemOriginal.classList.remove('priority');
        }
        salvarDados();
    });

    blocoLista.appendChild(li);
}

function removerDeFavoritos(itemId) {
    const blocoFav = obterBlocoFavoritos();
    if (blocoFav) {
        const li = blocoFav.querySelector(`li[data-item-id="${itemId}"]`);
        if (li) li.remove();
    }
}

function sincronizarItem(itemId, isChecked) {
    const blocoFav = obterBlocoFavoritos();
    if (blocoFav) {
        const lieFav = blocoFav.querySelector(`li[data-item-id="${itemId}"]`);
        if (lieFav) {
            if (isChecked) {
                lieFav.classList.add('checked');
            } else {
                lieFav.classList.remove('checked');
            }
        }
    }
}

// Criar novo bloco
createBlockBtn.addEventListener('click', function(e) {
    e.preventDefault();
    criarBloco(blockInput.value);
});

blockInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        criarBloco(blockInput.value);
    }
});

// ========== INICIALIZAR ==========
// Carregar tema salvo
carregarTema();

// Tentar carregar dados salvos
reconstruirDadosSalvos();