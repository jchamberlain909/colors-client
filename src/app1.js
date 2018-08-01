// Dom content loaded listener
document.addEventListener("DOMContentLoaded",()=>{
    createCanvas()
    initializeCanvas()
    userFormListener()
    gridClickListener()
    setEditFormListener()
    checkForUser()
    subscribeToServer()
    setLogoutListener()
})

function subscribeToServer() {
    source = new EventSource('http://localhost:3000/subscribe')
    source.onmessage = (e)=>{
        jsonData = JSON.parse(e.data)
        let pixel = document.getElementById(`pixel-${jsonData.id}`)
        if (pixel) {
            pixel.style.backgroundColor = jsonData.color
        }        
    }
}

function checkForUser() {
    if (sessionStorage.getItem('username')) {
        loginUser(sessionStorage.getItem('username'))
    }
}

function loginUser(username){
    fetch('http://localhost:3000/users', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                board_id: 1
            })
        })
        .then(res => res.json())
        .then(user => {
            sessionStorage.setItem('username', user.username)
            sessionStorage.setItem('userId', user.id)
            document.getElementById('user-form').style.visibility = 'hidden'
            displayUserInfo(user)
        })
}

function createCanvas() {
    let pixelGrid = document.getElementById('pixel-grid')
    for (let y = 0; y < 50; y++) {
        // create new row
        let row = document.createElement('div')
        row.classList.add('row')
        pixelGrid.appendChild(row)
        for (let x = 0; x < 50; x++) {
            // Create pixel div at x,y
            let pixel = document.createElement('div')
            pixel.id=`pixel-${x*50+y+1}`
            pixel.dataset.id = x*50+y+1
            pixel.dataset.x = x
            pixel.dataset.y= y
            pixel.classList.add('pixel')
            row.appendChild(pixel)
        }
    }
}

function initializeCanvas() {
    fetch('http://localhost:3000/boards/1')
    .then(res => res.json())
    .then(canvasData=>{
        
        canvasData.pixels.forEach(pixel => {
            document.getElementById(`pixel-${pixel.id}`).style.backgroundColor = pixel.color
        });
    })
}

function userFormListener() {
    document.getElementById('user-form').addEventListener('submit',e=>{
        e.preventDefault()
        let usernameInput = document.getElementById('username-input')
        loginUser(usernameInput.value)
    })
}

function displayUserInfo(user) {
    document.getElementById('user-info').style.visibility = 'visible'
    document.getElementById('username').innerText = user.username
    document.getElementById('total-pixels').innerText = user.totalPixels
    
}

function gridClickListener() {
    document.getElementById('pixel-grid').addEventListener('click',e=>{
        document.querySelectorAll('.selected').forEach((el)=>{
            el.classList.remove("selected")
        })

        e.target.classList.add("selected")
        showEditPixelForm(parseInt(e.target.dataset.id))
    })
}

function showEditPixelForm(pixelId) {
    let form = document.getElementById('edit-pixel-form')
    form.style.visibility = 'visible'
    form.dataset.id=pixelId
}


function setEditFormListener() {
    document.getElementById('colorPicker').addEventListener('change', e=>{
        if (!sessionStorage.getItem('username')) {
            alert("Please Sign up/Login")
        }else{
                document.querySelectorAll('.selected').forEach((el) => {
                    el.classList.remove("selected")
                })
                let selected = document.querySelector('input[name = "colors"]:checked');
                fetch(`http://localhost:3000/pixels/${document.getElementById('edit-pixel-form').dataset.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ color: selected.value, board_id:1 })
                }).then(res => res.json())
                    .then(pixelData => {
                        // update dom with color changed
                        document.getElementById(`pixel-${pixelData.id}`).style.backgroundColor = pixelData.color
                        selected.checked = false
                        document.getElementById('edit-pixel-form').style.visibility = 'hidden'
                        incrementUserPixelCount()
                })
        }
            
        
    })
}


function incrementUserPixelCount() {
    let totalPixels = document.getElementById('total-pixels')
    totalPixels.innerText = parseInt(totalPixels.innerText) + 1
    fetch(`http://localhost:3000/users/${sessionStorage.getItem('userId')}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            totalPixels: totalPixels.innerText
        })
    })
}

function setLogoutListener() {
    document.getElementById('logout').addEventListener('click', e => {
        // hide user info
        document.getElementById('user-info').style.visibility = 'hidden'
        // display loginform
        document.getElementById('user-form').style.visibility = 'visible'
        // clear session
        sessionStorage.clear()
    })
}