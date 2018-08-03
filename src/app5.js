const requestUrlBase = 'http://167.99.230.136'


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
    setMessageFormListener()
    document.body.addEventListener('click', e=>{
        hideEditPixelForm()
    })
    document.getElementById('edit-pixel-form').style.display='none'
})

function setMessageFormListener() {
    document.getElementById('message-form').addEventListener('submit',(e)=>{
        e.preventDefault()
        let messageInput = document.getElementById('message-input')
        fetch(`${requestUrlBase}/messages`,{
           method: "POST",
               headers: {
                   "Content-Type": "application/json"
               },
               body: JSON.stringify({
                   message: messageInput.value,
                   username: sessionStorage.getItem('username')
               })
        })
        .then(res=>messageInput.value="")

    })
}

function createMessage(username,messageText,timeStamp) {
    let message = document.createElement('p')
    message.classList.add('message')
    message.innerHTML = `${username}: ${messageText} - ${timeStamp}UTC`
    prependMessage(message)
}

function prependMessage(message) {
    let messages = document.getElementById('messages')
    messages.insertBefore(message,messages.firstChild)
}

function subscribeToServer() {


    source = new EventSource(`${requestUrlBase}/subscribe`)

    source.addEventListener("connected", (e) => {
        console.log(e)
    })

    source.addEventListener("pixels",e=>{
        
        let jsonData = JSON.parse(e.data)
        document.getElementById(`pixel-${jsonData.x},${jsonData.y}`).style.backgroundColor = jsonData.color
    })
    source.addEventListener("messages", e => {
        let messageData = JSON.parse(e.data)
        createMessage(messageData.username, messageData.message, messageData.time)
    })

}

function checkForUser() {
    if (sessionStorage.getItem('username')) {
        loginUser(sessionStorage.getItem('username'))
    }
}

function loginUser(username){
    fetch(`${requestUrlBase}/users`, {
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
            document.getElementById('user-form').style.display = 'none'
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
            pixel.id=`pixel-${x},${y}`
            pixel.dataset.id = x*50+y+1
            pixel.dataset.x = x
            pixel.dataset.y= y
            pixel.classList.add('pixel')
            row.appendChild(pixel)
        }
    }
}

function initializeCanvas() {
    fetch(`${requestUrlBase}/pixels`)
    .then(res => res.json())
    .then(pixelData=>{

        pixelData.forEach(pixel => {
            let pixelDOM = document.getElementById(`pixel-${pixel.x},${pixel.y}`)
            pixelDOM.style.backgroundColor = pixel.color
            if (pixel.user) {
                pixelDOM.dataset.username = pixel.user.username
            }else{
                pixelDOM.dataset.username = "No User"
            }
            
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
    document.getElementById('user-info').style.display = 'block'
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
        showEditPixelForm({x: parseInt(e.target.dataset.x), y:parseInt(e.target.dataset.y)})
    })
    
}

function showEditPixelForm(pixel) {
    let pixelDOM = document.getElementById(`pixel-${pixel.x},${pixel.y}`)
    let form = document.getElementById('edit-pixel-form')
    form.querySelector('#pixel-owner').innerText = pixelDOM.dataset.username
    var anotherPopper = new Popper(
        pixelDOM,
        form, {
            modifiers: {
                offset: {offset:'0,5'}
            }
        }
    );
    form.style.display = 'flex'
    form.dataset.id= pixel.x * 50 + pixel.y + 1

    
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
                fetch(`${ requestUrlBase }/pixels/${document.getElementById('edit-pixel-form').dataset.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ color: selected.value, user_id: sessionStorage.getItem('userId')})
                }).then(res => res.json())
                    .then(pixelData => {
                        
                        // update dom with color changed
                        let pixelDOM = document.getElementById(`pixel-${pixelData.x},${pixelData.y}`)
                        pixelDOM.style.backgroundColor = pixelData.color
                        pixelDOM.dataset.username = pixelData.user.username
                        selected.checked = false
                        document.getElementById('edit-pixel-form').style.display = 'none'
                        incrementUserPixelCount()
                })
        }


    })
}


function incrementUserPixelCount() {
    let totalPixels = document.getElementById('total-pixels')
    totalPixels.innerText = parseInt(totalPixels.innerText) + 1
    fetch(`${ requestUrlBase }/users/${sessionStorage.getItem('userId')}`, {
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
        document.getElementById('user-info').style.display = 'none'
        // display loginform
        document.getElementById('user-form').style.display = 'block'
        // clear session
        sessionStorage.clear()
    })
}


function hideEditPixelForm() {
    document.getElementById('edit-pixel-form').style.display = 'none'
}
