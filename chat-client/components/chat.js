import Reciept from './read.js';
import Resolver from '../resolver.js';
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const Chat = {
    props: ["context"],

    components: {
        Reciept
    },

    created() {
        this.resolver = new Resolver(this.$gf);
    },

    setup(props) {
        const { context } = Vue.toRefs(props);
        const $gf = Vue.inject('graffiti');
        return $gf.useObjects([context]);
    },

    data() {
        return {
            n: 5
        }
    },


    watch: {
        objects() {
            Notification.requestPermission().then((perm) => {
                if (perm === "granted") {
                    const text = `Check inbox`;
                    const notification = new Notification("To do list", {body: text});
                    this.notify(text);
                }
            });
        }
    },

    computed: {
        messages() {
            let messages = this.objects.filter(m => (m.type == "Note") && typeof m.content == "string");
            // console.log(`Found ${messages.length} messages in context of ${this.context}`);

            messages = messages.sort((m1, m2)=> new Date(m2.published) - new Date(m1.published))
                        .filter(m => m.content !== "")
                        .slice(0, this.n);
            messages.reverse();
            return messages;
        },

        schedule() {
            const schedule = this.objects.filter(m => (m.type == "Schedule") && typeof m.content == "string");
            // console.log(`Found ${messages.length} messages in context of ${this.context}`);

            if (schedule.length !== 0) {
                return schedule.sort((m1, m2)=> new Date(m2.published) - new Date(m1.published))
                            .reduce(m => m.schedule)[0];
            }
            return undefined;
        },
    },

    methods: {
        remove(message) {
            console.log(`Deleting ${message.content}`)
            this.$gf.remove(message);
        },

        load() {
            this.n += 5;
        },

        notify(text) {
            const notification = document.getElementById("notificationText")
            if (notification) {
                notification.innerText = text; 
                notification.click();
            }
        },

        opened() {
            for (const message of this.messages) {
                if (message.actor === this.$gf.me) continue;
                this.$gf.post({
                    type: "Read",
                    object: message.id,
                    context: [message.id]
                })
            }
        }
    },

    template: "#chat"
}

export default Chat;