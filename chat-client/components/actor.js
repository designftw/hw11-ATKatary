import Resolver from '../resolver.js';
import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const defaultIcon =  "https://thumbs.dreamstime.com/b/default-avatar-profile-vector-user-profile-default-avatar-profile-vector-user-profile-profile-179376714.jpg";

const Actor = {
    props: ["actor", "classes", "style"],

    created() {
        this.resolver = new Resolver(this.$gf);
    },

    setup(props) {
        const { actor } = Vue.toRefs(props);
        const $gf = Vue.inject('graffiti');
        return  $gf.useObjects([actor]);
    },

    data() {
        return {
            url: null,
            username: null,
        }
    },

    watch: {
        async actor() {
            // getting profile username
            if (!this.username) {
                this.username = await this.resolver.actorToUsername(this.actor);
            }

            console.log(`${this.actor.id} >> {name: ${this.name}, username: ${this.username}, icon: ${this.img}}`);
        },

        async icon(icon) {
            if (icon) {
                try {
                    const img = await this.$gf.media.fetch(icon.magnet);
                    this.url = URL.createObjectURL(img);
                    return;

                } catch (TypeError) {
                    console.log(`bad profile image for actor ${this.username}`);
                }
            }
            this.url = defaultIcon;
        }
    },

    computed: {
        name() {
            const _name = this.profile().filter(p => p.name && typeof p.name =='string')
                    .reduce((prev, curr)=> (!prev || (curr.published > prev.published))? curr : prev, null);

            if (!_name) return "";
            return _name.name;
        },

        icon() {
            const icon = this.profile().filter(p => p.icon && typeof p.icon =='object')
                .reduce((prev, curr)=> (!prev || (curr.published > prev.published))? curr : prev, null);

            if (!icon) return defaultIcon;
            return icon.icon;
        },
    },

    methods: {
        profile() {
            return this.objects.filter(m => m.type === "Profile");
        },

        upload() {
           document.getElementById("actorImgUpload").click();
           document.getElementById("actorImgSave").classList.remove("hidden");
           document.getElementById("actorImgCancel").classList.remove("hidden");
        },

        uploadActorImg(event) {
            const files = event.target.files;
            this.img = files[files.length - 1];

            this.temp = this.url;
            this.url = URL.createObjectURL(this.img);

            event.target.value = "";
        },

        async actorImg(save) {
            document.getElementById("actorImgSave").classList.add("hidden");
            document.getElementById("actorImgCancel").classList.add("hidden");

            if (save) {
                const magent = await this.$gf.media.store(this.img);
                this.$gf.post({
                    type: 'Profile',
                    icon: {
                      type: 'Image',
                      magnet: magent
                    }
                })
            }
            else if (this.temp) this.url = this.temp;
        }
    },

    template: "#actor"
}

export default Actor;