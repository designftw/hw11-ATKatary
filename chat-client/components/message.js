import Resolver from '../resolver.js';
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const Message = {
    props: ["actor"],

    created() {
        this.resolver = new Resolver(this.$gf);
    },

    setup(props) {
        const { actor } = Vue.toRefs(props);
        const $gf = Vue.inject('graffiti');
        return $gf.useObjects([actor]);
    },

    data() {
        return {
            content: ""
        }
    },

    methods: {
        async send() {
            if (this.content === "") return
            const message = {
                type: 'Note',
                content: this.content,
                context: [this.$gf.me, this.actor]
            }

            await this.$gf.post(message)
            this.content = ""
        }
    },

    template: "#message"
}

export default Message;