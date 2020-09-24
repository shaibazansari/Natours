import axios from 'axios'
import { showAlert} from './alerts'

const stripe = Stripe('pk_test_51HU87CJKBVX5ZxvepP0if62yKEzFKRGr3Sl80HmsTaaQoLbNRYlSx4lIW3uwZGgnHSBmCvLlXXlC9Mr5gzXV1kwF001NTfEQ0N')

export const bookTour = async tourId => {
    try {
        // 1. Get checkout session from API
        const session = await axios(
            `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
            )
        console.log(session)
        // 2. Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    } catch (err) {
        console.log(err)
        showAlert('error',err)
    }
}