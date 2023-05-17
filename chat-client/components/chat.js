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
            let notify = false;
            for (const message of this.messages) {
                const reciept = document.getElementById(`${message.id}Reciept`);
                if (reciept == null) return;
                if (reciept.innerText !== "read" && message.actor !== this.$gf.me) notify = true;
            };     
            if (!notify) return 
            
            let name = this.objects.filter(m => m.type === "Profile")
                                .filter(p => p.name && typeof p.name =='string')
                                .reduce((prev, curr)=> (!prev || (curr.published > prev.published))? curr : prev, null);
            if (!name) return "";
            name =  name.name;

            let schedule = this.objects.filter(o => {
                return (o.type == "Schedule") && 
                       (typeof o.schedule == "string") && 
                       (
                        ((o.context[0] === this.$gf.me) && (o.context[1] === this.context)) ||
                        ((o.context[1] === this.$gf.me) && (o.context[0] === this.context))
                       );
            })
            .sort((o1, o2)=> new Date(o2.published) - new Date(o1.published));

            if (schedule.length !== 0) {
                schedule = JSON.parse(schedule[0].schedule);
                const today = new Date();
                if (!schedule[today.getHours()][(today.getDay() + 6) % 7]) notify = false;            }

            if (!notify) return
            Notification.requestPermission().then((perm) => {
                if (perm === "granted") {
                    const text = `New message from ${name}`;
                    const notification = new Notification("To do list", {body: text});
                    this.notify(text);
                    console.log(text)
                }
            });
        }
    },

    computed: {
        messages() {
            let messages = this.objects.filter(m => {
                return  (m.type == "Note") && 
                        (typeof m.content == "string") && 
                        (m.context.length == 2) && 
                        (
                            ((m.context[0] == this.$gf.me) && (m.context[1] == this.context)) ||
                            ((m.context[1] == this.$gf.me) && (m.context[0] == this.context))
                        )
                        
            });
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
            const html = `<div 
            class="shadow align-center flex"
            style="
                border-radius: 10px;
                position: absolute; color: #2D87E2; width: 250px;
                top: 0; right: 0; padding: 15px; margin: 20px; 
                margin-right: 15px; background-color: #FFF;
            "
        >
            <img src="./images/icon-bell.png"style="width: 20px;"/>
            <p 
                @click="alert"
                :id="\`\${id}Text\`"
                class="text-center" 
                style="margin: 0; width: calc(100% - 20px);" 
            >${text}</p>
        </div>`
            const notification = document.getElementById("notification")
            if (notification) {
                notification.innerHTML += html; 
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