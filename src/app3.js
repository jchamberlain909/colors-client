// Dom content loaded listener
document.addEventListener("DOMContentLoaded",()=>{
    createBoard()
    initializeBoard()
    userFormListener()
    gridClickListener()
    setEditFormListener()
    checkForUser()
    subscribeToServer()
    setLogoutListener()
    document.body.addEventListener('click', e=>{
        hideEditPixelForm()
    })
})

function subscribeToServer() {
    source = new EventSource('http://167.99.230.136/subscribe')
    source.onmessage = (e)=>{
        jsonData = JSON.parse(e.data)
        document.getElementById(`pixel-${jsonData.x},${jsonData.y}`).style.backgroundColor = jsonData.color
    }
}

function checkForUser() {
    if (sessionStorage.getItem('username')) {
        loginUser(sessionStorage.getItem('username'))
    }
}

function loginUser(username){
    fetch('http://167.99.230.136/users', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username
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

function createBoard() {
    let pixelGrid = document.getElementById('pixel-grid')
    for (let y = 0; y < 50; y++) {
        // create new row
        let row = document.createElement('div')
        row.classList.add('row')
        pixelGrid.appendChild(row)
        for (let x = 0; x < 50; x++) {
            // Create pixel div at x,y
            let pixel = document.createElement('div')
            pixel.id=`pixel-${x},${y}`
            pixel.dataset.x = x
            pixel.dataset.y= y
            pixel.classList.add('pixel')
            row.appendChild(pixel)
        }
    }
}

function initializeBoard() {
    fetch('http://167.99.230.136/pixels')
    .then(res => res.json())
    .then(pixelData=>{
        
        pixelData.forEach(pixel => {
            document.getElementById(`pixel-${pixel.x},${pixel.y}`).style.backgroundColor = pixel.color
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
        e.stopPropagation()
        document.querySelectorAll('.selected').forEach((el)=>{
            el.classList.remove("selected")
        })

        e.target.classList.add("selected")
        showEditPixelForm({x: parseInt(e.target.dataset.x),y: parseInt(e.target.dataset.y)})
    })
    document.getElementById('pixel-grid').addEventListener('dblclick', e => {
        e.stopPropagation()
        // Show user who owns pixel in popup
    })
}

function showEditPixelForm(pixel) {
    let pixelDOM = document.getElementById(`pixel-${pixel.x},${pixel.y}`)
    let form = document.getElementById('edit-pixel-form')
    var anotherPopper = new Popper(
        pixelDOM,
        form, {
            modifiers: {
                offset: {offset:'0,5'}
            }
        }
    );
    form.style.visibility = 'visible'
    form.dataset.id=pixel.x*50 + pixel.y + 1
}


function setEditFormListener() {
    document.getElementById('colorPicker').addEventListener('change', e=>{
        if (!sessionStorage.getItem('username')) {
            alert("Please Sign up/Login")
        }else{
            if (document.querySelector('input[name = "colors"]:checked')===null) {
                alert("Please select a color")
            }
            else{
                document.querySelectorAll('.selected').forEach((el) => {
                    el.classList.remove("selected")
                })
                let selected = document.querySelector('input[name = "colors"]:checked');
                fetch(`http://167.99.230.136/pixels/${document.getElementById('edit-pixel-form').dataset.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ color: selected.value, user_id: sessionStorage.getItem('user_id') })
                }).then(res => res.json())
                    .then(pixelData => {
                        // update dom with color changed
                        document.getElementById(`pixel-${pixelData.x},${pixelData.y}`).style.backgroundColor = pixelData.color
                        selected.checked = false
                        document.getElementById('edit-pixel-form').style.visibility = 'hidden'
                        incrementUserPixelCount()
                })
            }
            
        }
    })
}


function incrementUserPixelCount() {
    let totalPixels = document.getElementById('total-pixels')
    totalPixels.innerText = parseInt(totalPixels.innerText) + 1
    fetch(`http://167.99.230.136/users/${sessionStorage.getItem('userId')}`, {
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


function hideEditPixelForm() {
    document.getElementById('edit-pixel-form').style.visibility = 'hidden'
}