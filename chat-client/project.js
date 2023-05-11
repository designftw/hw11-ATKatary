import Resolver from './resolver.js';
import { mixin } from "https://mavue.mavo.io/mavue.js";
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import GraffitiPlugin from 'https://graffiti.garden/graffiti-js/plugins/vue/plugin.js';

/*** Components ***/
import Chat from './components/chat.js';
import Read from './components/read.js';
import Actor from './components/actor.js';
import Message from './components/message.js';
import Schedule from './components/schedule.js';
import Notification from './components/notification.js';

const app = {
    mixins: [mixin],

    created() {
        this.resolver = new Resolver(this.$gf);
    },

    setup() {
        const $gf = Vue.inject('graffiti');
        const channel = Vue.ref('default');
        const context = [channel.value];

        const {objects: objects} = $gf.useObjects(context);
        return { context, channel, objects };
    },

    data() {
        return {
            n: 50
        }
    },

    computed: {
        actors() {
            const _actors = [...new Set(this.objects.map(m => m.actor).filter(a => a !== this.$gf.me))];
            // console.log(`Found ${this.objects.length} messages from ${_actors.length} in context of ${this.context}`);
            return _actors.slice(0, this.n);
        }
    },

    methods: {
        chat(actor) {
            for (const _actor of this.actors) {
                document.getElementById(`${_actor}`).classList.remove("chatting");
                document.getElementById(`${_actor}Chat`).classList.remove("flex");
                document.getElementById(`${_actor}Chat`).classList.add("hidden");
            }

            // console.log(`Messaging ${actor}`);
            document.getElementById(`${actor}`).classList.add("chatting");
            document.getElementById(`${actor}Chat`).classList.remove("hidden");
            document.getElementById(`${actor}Chat`).classList.add("flex");

            // marking all messages as read
            const unreads = document.getElementById(`${actor}Unreads`)
            unreads.innerText = "";
            unreads.style.backgroundColor = "transparent";

            document.getElementById(`${actor}Open`).click();
        },

        messages(actor) {
            const [add, remove] = ["add", "remove"];
            const [flex, hidden] = ["flex", "hidden"];
            const [settings, messages] = [`${actor}Settings`, `${actor}Messages`];
            
            this.display(
                [
                    [settings, hidden, add],
                    [messages, hidden, remove], 
                    [`${messages}Btn`, hidden, add],
                    [`${settings}Btn`, hidden, remove]
                ]
            );
        },

        settings(actor) {
            const [add, remove] = ["add", "remove"];
            const [flex, hidden] = ["flex", "hidden"];
            const [settings, messages] = [`${actor}Settings`, `${actor}Messages`];
            
            this.display(
                [
                    [messages, hidden, add],
                    [settings, hidden, remove], 
                    [`${settings}Btn`, hidden, add],
                    [`${messages}Btn`, hidden, remove]
                ]
            );
        },

        display(map) {
            for (let i = 0; i < map.length; i++) {
                const [id, display, action] = map[i];
                
                if (action === "add") {
                    document.getElementById(id).classList.add(display);
                }
                else document.getElementById(id).classList.remove(display);
            }
            
        }
    }
}

Vue.createApp(app)
    .component("notification", Notification)
    .component("schedule", Schedule)
    .component("message", Message)
    .component("actor", Actor)
    .component("chat", Chat)
    .component("read", Read)
    .use(GraffitiPlugin(Vue))
    .mount('#app')