import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref as dbRef, update, onValue, get, set, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    //
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

const ref_db_postagens = dbRef(database, "postagens");

let idpost = "petMidia" + Math.round(Math.random() * 10000000);
let user = "";
let currentPage = 0;
const postsPerPage = 6;
let postFeedAll;

const loadMoreButton = document.querySelector(".carregar");
let buttonSend = document.querySelector(".btnsend");

//sistema - salvar usuario
if(localStorage.getItem("usuario")){
    user = localStorage.getItem("usuario")
}else{
    localStorage.removeItem("usuario")
    localStorage.setItem("usuario", prompt("Digite o nome do usuario:"))
    location.reload()
}

//sistema - enviar dados para a postagem
buttonSend.addEventListener("click", async () => {
    try {
        let fileInput = document.querySelector(".imgPetMidia").files[0];
        let nameInput = document.querySelector(".namepet").value;
        let descriptionInput = document.querySelector(".description").value;
        idpost = "petMidia" + Math.round(Math.random() * 10000000);
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
async function ampliarPost(u){
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

                document.querySelector(".btnAlert").addEventListener("click", () => {
                    push(dbRef(database ,`/analise/${userPetName}/${namePetMidia}`), prompt("Digite o motivo do sinal de alerta:"))
                })
                
            }catch(er){
                console.log(er)
            }
        })
    })
}

//sistema - mostrar posts

const postagensRef = dbRef(database, 'postagens');

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
            ampliarPost(users)
        }
    } catch (error) {
        console.error(error);
    }
};

const listenToChanges = () => {
    onValue(postagensRef, (snapshot) => {
        const users = snapshot.val();
        showPosts(users);
        loadMoreButton.addEventListener("click", () => {
            currentPage++;
            showPosts(users);
        });
    });
};

listenToChanges();