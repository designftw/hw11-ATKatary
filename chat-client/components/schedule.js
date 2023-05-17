import Resolver from '../resolver.js';
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const Schedule = {
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
            loaded: false,
            default: true,
            defaultAll: false,
            localSchedule: undefined,
            days: ['Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'],
        }
    },

    computed: {
        schedule() {
            const schedule = this.objects.filter(o => {
                return (o.type == "Schedule") && 
                       (typeof o.schedule == "string") && 
                       (
                        ((o.context[0] === this.$gf.me) && (o.context[1] === this.actor)) ||
                        ((o.context[1] === this.$gf.me) && (o.context[0] === this.actor))
                       );
            })
                    .sort((o1, o2)=> new Date(o2.published) - new Date(o1.published));

            if (schedule.length === 0 || this.defaultAll) {
                const [R, C] = [24, 7];
    
                for (let i = 0; i < R; i++) {
                    const row = []
                    for (let j = 0; j < C; j++) row[j] = this.default;
                    schedule[i] = row;
                }
                this.localSchedule = schedule;
                if (this.defaultAll) this.defaultAll = false;
            } else {
                this.localSchedule = JSON.parse(schedule[0].schedule)
            }
  
            return this.localSchedule;
        }
    },

    methods: {
        select(event) {
            const cell = event.target;
            const [i, j] = cell.id.split(",");

            const [gray, aquamarine] = ["#c4c4c4c4", "aquamarine"]
            if (this.localSchedule[i][j]) {
                this.localSchedule[i][j] = false;
                event.target.style.backgroundColor = gray;
            } else {
                this.localSchedule[i][j] = true;
                event.target.style.backgroundColor = aquamarine;
            }
        },

        async save() {
            const schedule = {
                type: 'Schedule',
                context: [this.$gf.me, this.actor],
                schedule: JSON.stringify(this.localSchedule)
            }
            await this.$gf.post(schedule);
            console.log("Done saving")
        },

        selectAll() {
            this.default = true;
            this.defaultAll = true;
        },

        clearAll() {
            this.default = false; 
            this.defaultAll = true;
        },

        reset() {
            this.clearAll();
            this.default = true; 
            this.defaultAll = false;
        }
    },

    template: "#schedule"
}

export default Schedule;