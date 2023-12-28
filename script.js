import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref as dbRef, update, onValue, get, set, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDr6LscgbmbrKJS3x6P7ZCba6kGmzZnsVQ",
    authDomain: "petmidia-e6af1.firebaseapp.com",
    databaseURL: "https://petmidia-e6af1-default-rtdb.firebaseio.com",
    projectId: "petmidia-e6af1",
    storageBucket: "petmidia-e6af1.appspot.com",
    messagingSenderId: "360479474523",
    appId: "1:360479474523:web:8cd3066bcc94c2510ed07e",
    measurementId: "G-V7XB9CC5HC"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

// const ref_db_postagens = dbRef(database, "postagens");
const postagensRef = dbRef(database, 'postagens');

let idpost = "petMidia" + Math.round(Math.random() * 10000000);
let user = "";
let currentPage = 0;
const postsPerPage = 6;
let postFeedAll;
let valueReturn;

const loadMoreButton = document.querySelector(".carregar");
let buttonSend = document.querySelector(".btnsend");

function openModal(type, text) {
    const modal = document.getElementById('myModal');
    const modalText = document.getElementById('modalText');
    const inputField = document.getElementById('inputValue');
    const btnOK = document.getElementById('btnOK');

    modal.style.display = 'block'; // Exibe o modal

    modalText.textContent = text; // Define o texto do modal

    // Se for um promptModal, exibe a caixa de texto e o botão OK
    if (type === 'promptModal') {
        inputField.style.display = 'block';
        btnOK.style.display = 'block';

        btnOK.addEventListener('click', () => {
            const value = inputField.value;
            closeModal();
            // Aqui você pode fazer algo com o valor retornado, como imprimir no console
            console.log('Valor do input:', value);
            valueReturn = value
        });
    }
    // Se for um alertModal, esconde a caixa de texto e o botão OK
    else if (type === 'alertModal') {
        inputField.style.display = 'none';
        btnOK.style.display = 'none';
    }
}

//sistema - salvar usuário
if (localStorage.getItem("usuario") && localStorage.getItem("usuario") !== 'undefined') {
    user = localStorage.getItem("usuario");
} else {
    document.querySelector(".user").innerHTML = ''
    document.querySelector(".user").innerHTML = '<h3>Caro(a) usuario, porfavor insira o nome do usuario, caso contrario você não poderá usar algumas funcionalidades!</h3>'
    openModal("promptModal", "Digite o nome do usuario:")
    document.getElementById('btnOK').addEventListener("click", async()=>{
        await localStorage.setItem("usuario", valueReturn)
        location.reload()
    })
}

// Função para fechar o modal
function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

const closeBtn = document.querySelector('.close');
closeBtn.addEventListener('click', closeModal);

//sistema - enviar dados para a postagem
buttonSend.addEventListener("click", async () => {
    try {
        let fileInput = document.querySelector(".imgPetMidia").files[0];
        let nameInput = document.querySelector(".namepet").value;
        let descriptionInput = document.querySelector(".description").value;
        idpost = "petMidia" + Math.round(Math.random() * 10000000);//id unico para cada publicação
        let storageref = storageRef(storage, 'images/' + idpost);

        if(nameInput !== "" && descriptionInput !== "" && user !== "" && fileInput){
            const snapshot = await uploadBytes(storageref, fileInput);

            const postagemBase = {
                [idpost]: {
                    namepet: nameInput,
                    description: descriptionInput,
                    namemidia: idpost,
                    likes: 1,
                    userPet: user,
                    visits: 1
                }
            };

            await update(dbRef(database, "postagens/" + user), postagemBase);
            location.reload()
        } else {
            alert("error")
        }
    } catch (error) {
        console.error(error);
    }
});


//sistema - ampliar postagem
async function enlargePost(u){
    await postFeedAll.forEach((div)=>{
        div.addEventListener("click", async ()=>{
            let userPetName = document.querySelector(`.feed > .${div.classList[0]} > .txt_user`).innerText;
            let namePetMidia = div.classList[0];
            
            const postRefposts = dbRef(database, `postagens/${userPetName}/${namePetMidia}`)
            const storageRefImagem = storageRef(storage, `images/${namePetMidia}`);
            try {
                const snapshot = await get(postRefposts);
                const postData = snapshot.val();
                const url = await getDownloadURL(storageRefImagem);

                let divWindowPost = document.createElement("div");
                divWindowPost.classList.add("window_post")
                document.querySelector(".midia").appendChild(divWindowPost);
                document.querySelector(".feed").style.display = "none"
                document.querySelector(".carregar").style.display = "none"

                update(dbRef(database, `postagens/${userPetName}/${namePetMidia}`), {visits: postData.visits+1})

                document.querySelector(".window_post").innerHTML = `<div class='buttons'><div><img src='./src/btnclose.svg' class='btnClose'> <img src='./src/btnalert.svg' class='btnAlert' alt='Enviar para analise publicação'></div><img src='${url}' class='imgPost'></div> <div class='texts_user'><h3>Nome do pet: ${postData.namepet}</h3> <p><strong>Descrição:</strong> ${postData.description}</p></div> <div class='buttonLike'><img src='./src/btnlike.svg' class='like1'> <h3 class='txt_like'>${postData.likes}</h3></div>`
            
                document.querySelector(".like1").addEventListener("click", async () => {
                    let updateLikesPost = postData.likes + 1;
                    await update(dbRef(database, `postagens/${userPetName}/${namePetMidia}`), { likes: updateLikesPost });
                    document.querySelector(".txt_like").innerText = updateLikesPost; 
                })

                document.querySelector(".btnClose").addEventListener("click", ()=>{
                    document.querySelector(".midia").removeChild(document.querySelector(".window_post"))
                    document.querySelector(".feed").style.display = "flex"
                    document.querySelector(".carregar").style.display = "block"
                })

                //sistema - denunciar postagem
                document.querySelector(".btnAlert").addEventListener("click", () => {
                    openModal("promptModal", "Insira o motivo da denuncia:")
                    document.getElementById('btnOK').addEventListener("click", async()=>{
                        push(dbRef(database ,`/analise/${userPetName}/${namePetMidia}`), valueReturn)
                    })
                })
                
            }catch(er){
                console.log(er)
            }
        })
    })
}

//sistema - mostrar posts
const showPosts = async (users) => {
    try {
        const feedDiv = document.querySelector('.feed');
        feedDiv.innerHTML = '';

        let postIndex = 0; //rastrear a posição da paginação de post

        for (const userId in users) {
            const postagensUsuario = users[userId];

            for (const postId in postagensUsuario) {
                if (postIndex >= currentPage * postsPerPage && postIndex < (currentPage + 1) * postsPerPage) {
                    const postagem = postagensUsuario[postId];
                    const { namepet, namemidia, userPet, likes, visits } = postagem;

                    const postDiv = document.createElement('div');
                    postDiv.classList.add(namemidia);

                    const nomePetParagrafo = document.createElement('p');
                    nomePetParagrafo.innerHTML = `<span><strong>${namepet}</strong></span>`

                    const imagemPet = document.createElement('img');
                    imagemPet.classList.add("foto");

                    const userTextPost = document.createElement("p")
                    userTextPost.classList.add("txt_user")
                    
                    userTextPost.innerText = userPet
                    userTextPost.style.display = "none"

                    const infosDiv = document.createElement("div")
                    infosDiv.classList.add("infosDiv")
                    infosDiv.innerHTML = `<div><img src= './src/btnlike.svg'> <h3>${likes}</h3> </div> <div><img src= './src/icon_visu.svg'> <h3>${visits}</h3> </div>`

                    const storageRefImagem = storageRef(storage, `images/${namemidia}`);
                    try {
                        //sistema - aparecer imagem do post/pet\:
                        const url = await getDownloadURL(storageRefImagem);
                        imagemPet.src = url;
                    } catch (error) {
                        console.error('Erro ao obter URL da imagem:', error);
                    }


                    postDiv.appendChild(imagemPet);
                    postDiv.appendChild(nomePetParagrafo);
                    postDiv.appendChild(userTextPost);
                    postDiv.appendChild(infosDiv);

                    feedDiv.appendChild(postDiv);
                }
                postIndex++;
            }
            postFeedAll = document.querySelectorAll(".feed > div")
            enlargePost(users)
        }
    } catch (error) {
        console.error(error);
    }
};

const listenToChanges = () => {
    onValue(postagensRef, (snapshot) => {
        const users = snapshot.val();
        showPosts(users);//mostrar postagens dos usuarios
        loadMoreButton.addEventListener("click", () => {
            currentPage++; //ir para a proxima pagina
            showPosts(users);
        });
    });
};

listenToChanges();