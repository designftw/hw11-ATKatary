import Resolver from '../resolver.js';
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const Read = {
    props: ["messageid", "context", "actor"],

    created() {
        this.resolver = new Resolver(this.$gf);
    },

    setup(props) {
        const $gf = Vue.inject('graffiti');
        const { messageid } = Vue.toRefs(props);
        return $gf.useObjects([messageid])
    },

    data() {
        return {
        }
    },

    computed: {
        read() {
            if (this.actor !== this.$gf.me) {
                const unread = this.objects.filter(o => (o.type === "Read") && (o.object === this.messageid) && (o.actor === this.$gf.me))
                                .reduce((prev, curr) => prev + 1, 0) === 0;

                const elm =  document.getElementById(`${this.context}Unreads`);
                if (elm.innerText === "") {
                    elm.innerText = "0";
                } 
        
                elm.innerText = unread ? `${Math.floor((parseInt(elm.innerText) + 1) / 2)}` : `${Math.max((parseInt(elm.innerText)) / 2, 0)}`;

                if (parseInt(elm.innerText) !== 0) {
                    elm.style.backgroundColor = "rgb(45, 135, 226)"
                } else {
                    elm.innerText = ""
                    elm.style.backgroundColor = "transparent"
                }
                return "";
            }
            
            const read = this.objects.filter(o => (o.type === "Read") && (o.object === this.messageid) && (o.actor !== this.$gf.me))
                            .reduce((prev, _) => prev + 1, 0) !== 0;
            return read ? "read" : "";
        }
    },

    template: "#read"
}

export default Read;