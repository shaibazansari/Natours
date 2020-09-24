import axios from 'axios'
import { showAlert} from './alerts'

export const login = async (email,password) => {
    // alert(`${email} ${password}`)
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/login',
            data: {
                email,
                password
            }
        })
        if (res.data.status === 'success') {
            showAlert('success','Logged in successfully')
            window.setTimeout(() => {
                location.assign('/')
            },1500)
        }
    } catch (err) {
        showAlert('error',err.response.data.message)
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout'
        })
        if(res.data.status === 'success') location.reload(true);
    } catch (err) {
        showAlert('error', 'Error logging out! Try again')
    }
}

export const signup = async (name,email,password,confirmPassword) => {
    // console.log(name,email,password,confirmPassword)
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm: confirmPassword
            }
        })
        console.log(res)
        if (res.data.status === 'success') {
            showAlert('success','Signed Up successfully')
            window.setTimeout(() => {
                location.assign('/')
            },1500)
        }
    } catch (err) {
        showAlert('error',err.response.data.message)
    }
}