import Resolver from '../resolver.js';
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const Notification = {
    props: ["id", "timeout"],

    created() {
    },

    setup() {
    },

    data() {
        return {
        }
    },

    methods: {
        alert() {
            const [flex, hidden] = ["flex", "hidden"];
            const notification = document.getElementById(this.id)

            notification.classList.add(flex);
            notification.classList.remove(hidden);
            setTimeout(() => {
                notification.classList.add(hidden);
                notification.classList.remove(flex);
                notification.innerHTML = "";
            }, this.timeout * 1000);
        }
    },

    template: "#notification"
}

export default Notification;