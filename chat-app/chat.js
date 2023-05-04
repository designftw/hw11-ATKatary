import * as Vue from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import { mixin } from "https://mavue.mavo.io/mavue.js";
import GraffitiPlugin from 'https://graffiti.garden/graffiti-js/plugins/vue/plugin.js'
import Resolver from './resolver.js'

const app = {
  // Import MaVue
  mixins: [mixin],

  // Import resolver
  async created() {
    this.resolver = new Resolver(this.$gf)
    // console.log(`${this.$gf.me} => ${this.username}`)
  },

  watch: {
    async messages(messages) {
      if (!this.username) this.username = await this.resolver.actorToUsername(this.$gf.me);
      const messagesWithAttach = messages.filter(
        message => message.attachment && message.attachment.type === "Image" && message.attachment.magnet
      );

      for (const message of messagesWithAttach) {
        if (!( message.attachment.magnet in this.downloadedImages)) {
          try {
            const imgUrl = URL.createObjectURL(await this.$gf.media.fetch(message.attachment.magnet));
            // console.log("cahcing >> " + imgUrl)
            this.downloadedImages[message.attachment.magnet] = imgUrl;
          } catch (error) {
            continue;
          }
        }
      }
    }
  },

  setup() {
    // Initialize the name of the channel we're chatting in
    const channel = Vue.ref('default')

    // And a flag for whether or not we're private-messaging
    const privateMessaging = Vue.ref(false)

    // If we're private messaging use "me" as the channel,
    // otherwise use the channel value
    const $gf = Vue.inject('graffiti')
    const context = Vue.computed(()=> privateMessaging.value? [$gf.me] : [channel.value])

    // Initialize the collection of messages associated with the context
    const { objects: messagesRaw } = $gf.useObjects(context)
    return { channel, privateMessaging, messagesRaw }
  },

  data() {
    // Initialize some more reactive variables
    return {
      messageText: '',
      editID: '',
      editText: '',
      recipient: '',
      username: '',
      recipientUsername: '',
      loaded: 10,
      usernameStatus: '',
      file: undefined,
      downloadedImages: {}
    }
  },

  computed: {
    messages() {
      // console.log(this.$gf.me)
      let messages = this.messagesRaw
        // Filter the "raw" messages for data
        // that is appropriate for our application
        // https://www.w3.org/TR/activitystreams-vocabulary/#dfn-note
        .filter(m=>
          // Does the message have a type property?
          m.type         &&
          // Is the value of that property 'Note'?
          m.type=='Note' &&
          // Does the message have a content property?
          m.content      &&
          // Is that property a string?
          typeof m.content=='string') 

      // Do some more filtering for private messaging
      if (this.privateMessaging) {
        messages = messages.filter(m=>
          // Is the message private?
          m.bto &&
          // Is the message to exactly one person?
          m.bto.length == 1 &&
          (
            // Is the message to the recipient?
            m.bto[0] == this.recipient ||
            // Or is the message from the recipient?
            m.actor == this.recipient
          ))
      }

      return messages
        // Sort the messages with the
        // most recently created ones first
        .sort((m1, m2)=> new Date(m2.published) - new Date(m1.published))
        // Only show the 10 most recent ones
        .slice(0,this.loaded)
    },

    users() {
      const activeUsers = {};
      for (const message of this.messages) {
        if (!(this.$gf.me in message.context)) continue
        console.log("found private message!")
        if (!(message.actor in activeUsers)) {
          activeUsers['message.actor'] = [message];
        } else {
          activeUsers['message.actor'].push(message);
        }
      }
    }
  },

  methods: {
    async sendMessage() {
      const message = {
        type: 'Note',
        content: this.messageText,
      }

      if (this.file != undefined) message.attachment = {
        type: 'Image',
        magnet: await this.$gf.media.store(this.file)
      }      

      // console.log(message)
      // The context field declares which
      // channel(s) the object is posted in
      // You can post in more than one if you want!
      // The bto field makes messages private
      if (this.privateMessaging) {
        message.bto = [this.recipient]
        message.context = [this.$gf.me, this.recipient]
      } else {
        message.context = [this.channel]
      }

      // Send!
      await this.$gf.post(message)
      this.messageText = ""
      this.file = undefined;
      // document.getElementById("img").value = "";
      document.getElementById("attach").style.display = "none";
    },

    removeMessage(message) {
      this.$gf.remove(message)
    },

    startEditMessage(message) {
      // Mark which message we're editing
      this.editID = message.id
      // And copy over it's existing text
      this.editText = message.content
    },

    backToChannel() {
      this.privateMessaging = false;
    },

    saveEditMessage(message) {
      // Save the text (which will automatically
      // sync with the server)
      message.content = this.editText
      // And clear the edit mark
      this.editID = ''
    },

    privateMessage(actor) {
      this.recipient = actor;
      this.privateMessaging = true;
      document.body.getElementById("private").classList.add("appear")
      setTimeout(() => document.getElementById("private").classList.remove("appear"), 1000)
    },

    async requestUsername() {
      try {
        if (this.username == "") return alert("Please enter a username");
        await this.resolver.requestUsername(this.username);
        this.usernameStatus = "Success!"
        document.getElementById("notification").style.display = "flex"
        setTimeout(() => {
          document.getElementById("notification").style.display = "none"
        }, 3000)
      } catch (error) {
        this.usernameStatus = error
        document.getElementById("notification").style.display = "flex"
        setTimeout(() => {
          document.getElementById("notification").style.display = "none"
        }, 3000)
      }
    },

    async search() {
      this.recipient = await this.resolver.usernameToActor(this.recipientUsername);
      console.log(`${this.recipientUsername} => ${this.recipient}`)
    },

    loadMore() {
      this.loaded += 10;
    },

    uploadImg() {
      document.getElementById('img').click()
    },

    onImageAttachment(event) {
      const file = event.target.files[0]
  
      document.getElementById("attach").style.display = "flex";
      document.getElementById("attachName").innerText = file.name;

      this.file = file;
    },

    onImageRemove(event) {
      this.file = undefined;
      event.target.value = "";

      document.getElementById("attach").style.display = "none";
    }
  }
}

const Name = {
  props: ['actor', 'editable'],

  setup(props) {
    // Get a collection of all objects associated with the actor
    const { actor } = Vue.toRefs(props)
    const $gf = Vue.inject('graffiti')
    return $gf.useObjects([actor])
  },

  watch: {
    async actor() {
      this.resolver = new Resolver(this.$gf);
      this.username = await this.resolver.actorToUsername(this.actor);
    },
  },

  computed: {
    profile() {
      const prof = this.objects
        // Filter the raw objects for profile data
        // https://www.w3.org/TR/activitystreams-vocabulary/#dfn-profile
        .filter(m=>
          // Does the message have a type property?
          m.type &&
          // Is the value of that property 'Profile'?
          m.type=='Profile' &&
          // Does the message have a name property?
          m.name &&
          // Is that property a string?
          typeof m.name=='string')
        // Choose the most recent one or null if none exists
        .reduce((prev, curr)=> !prev || curr.published > prev.published? curr : prev, null)
        // console.log(prof);
        return prof;
    }
  },

  data() {
    return {
      editing: false,
      editText: '',
      username: "",
    }
  },

  methods: {
    editName() {
      this.editing = true
      // If we already have a profile,
      // initialize the edit text to our existing name
      this.editText = this.profile? this.profile.name : this.editText
    },

    saveName() {
      if (this.profile) {
        // If we already have a profile, just change the name
        // (this will sync automatically)
        this.profile.name = this.editText
      } else {
        // Otherwise create a profile
        this.$gf.post({
          type: 'Profile',
          name: this.editText
        })
      }

      // Exit the editing state
      this.editing = false
    }
  },

  template: '#name'
}

const Like = {
  props: ["messageid", "actor"],

  setup(props) {
    const $gf = Vue.inject('graffiti')
    const messageid = Vue.toRef(props, 'messageid')
    const { objects: likesRaw } = $gf.useObjects([messageid])
    return { likesRaw }
  },

  computed: {
    likes() {
      // console.log(this.likesRaw)
      return this.likesRaw.filter(
        like => (like.type === "Like") && (like.object === this.messageid)
      )
    }
  },

  methods: {
    sendLike(event) {
      event.target.classList.add("spin");
      const myLikes = this.likesRaw.filter(
        like => (like.type === "Like") && (like.object === this.messageid) && (like.actor === this.$gf.me)
      )
      if (myLikes.length > 0) return;

      const like = {
        type: 'Like',
        object: this.messageid,
        context: [this.messageid]
      }

      // Send!
      setTimeout(() =>event.target.classList.remove("spin"), 1000)
      this.$gf.post(like)
    },

    unlike(event) {
      event.target.classList.add("spin-2");
      setTimeout(() => event.target.classList.remove("spin"), 1000)
      const myLikes = this.likesRaw.filter(
        like => (like.type === "Like") && (like.object === this.messageid) && (like.actor === this.$gf.me)
      )
      this.$gf.remove(...myLikes);
    }
  },
  template: '#like'
}

const Read = {
  props: ["messageid", "actor"],
  components: {
    Name
  },

  setup(props) {
    const $gf = Vue.inject('graffiti')
    const messageid = Vue.toRef(props, 'messageid')
    const { objects: messagesRaw } = $gf.useObjects([messageid])
    return { messagesRaw }
  },

  created() {
    this.resolver = new Resolver(this.$gf)

    const myLikes = this.messagesRaw.filter(
      like => (like.type === "Read") && (like.object === this.messageid) && (like.actor === this.$gf.me)
    )
    if (myLikes.length > 0) return;

    const Read = {
      type: 'Read',
      object: this.messageid,
      context: [this.messageid]
    }

    // Send!
    this.$gf.post(Read)
    // console.log(`${this.$gf.me} => ${this.username}`)
  },

  computed: {
    read() {
      return this.messagesRaw.filter(
        message => (message.type === "Read") && (message.object === this.messageid) && (message.actor !== this.$gf.me)
      )
    }
  },
  template: '#read'
}

const Reply = {
  props: ["messageid", "replyText"],

  setup(props) {
    const $gf = Vue.inject('graffiti')
    const messageid = Vue.toRef(props, 'messageid')
    const { objects: likesRaw } = $gf.useObjects([messageid])
    return { likesRaw }
  },

  data() {
    return {
      messageText: "",
      replying: false,
      file: undefined,
    }
  },

  computed: {
    likes() {
      // console.log(this.likesRaw)
      return this.likesRaw.filter(
        like => (like.type === "Like") && (like.object === this.messageid)
      )
    }
  },

  methods: {
    startReply() {
      console.log("Replying to " + this.replyText)
      this.replyingTo = this.messageid
      this.replying = true;
    },

    async sendReply() {
      const message = {
        type: 'Note',
        content: this.messageText,
        inReplyTo: this.messageid,
        context: [this.messageid, document.getElementById("channel").value]
      }

      if (this.file != undefined) message.attachment = {
        type: 'Image',
        magnet: await this.$gf.media.store(this.file)
      }      

      // console.log(message)
      // The context field declares which
      // channel(s) the object is posted in
      // You can post in more than one if you want!
      // The bto field makes messages private
      
      console.log(this.recipient)
      // Send!
      await this.$gf.post(message)
      this.messageText = ""
      this.file = undefined;
      this.replying = false;
      // document.getElementById("img").value = "";
      // document.getElementById("replyAttach").style.display = "none";
    },

    onImageAttachment(event) {
      const file = event.target.files[0]
  
      document.getElementById("replyAttach").style.display = "flex";
      document.getElementById("replyAttachName").innerText = file.name;

      this.file = file;
    },

    onImageRemove(event) {
      this.file = undefined;
      event.target.value = "";

      document.getElementById("replyAttach").style.display = "none";
    },

    uploadImg() {
      document.getElementById('img').click()
    },
  },
  template: '#reply'
}

const Profile = {
  props: ['actor', 'editable'],

  setup(props) {
    // Get a collection of all objects associated with the actor
    const { actor } = Vue.toRefs(props)
    const $gf = Vue.inject('graffiti')
    return $gf.useObjects([actor])
  },

  // async created() {
  //   this.resolver = new Resolver(this.$gf)
  //   // console.log(`${this.$gf.me} => ${this.username}`)
  // },

  watch: {
    async profile(profile) {
      this.resolver = new Resolver(this.$gf)
      this.url = await this.$gf.media.fetch(profile.icon.magnet[0]);
      this.pic = URL.createObjectURL(this.url);
    }
  },

  computed: {
    profile() {
      const prof = this.objects
        // Filter the raw objects for profile data
        // https://www.w3.org/TR/activitystreams-vocabulary/#dfn-profile
        .filter(m=>
          // Does the message have a type property?
          m.type &&
          // Is the value of that property 'Profile'?
          m.type=='Profile' &&
          // Does the message have a name property?
          m.icon &&
          // Is that property a string?
          typeof m.icon=='object')
        // Choose the most recent one or null if none exists
        .reduce((prev, curr)=> !prev || curr.published > prev.published? curr : prev, null)
        // console.log(profile);
        return prof;
    }
  },

  data() {
    return {
      editing: false,
      pic: undefined,
      username: "",
      url: undefined
    }
  },

  methods: {
    editPic() {
      this.editing = true
      // If we already have a profile,
      // initialize the edit text to our existing name
      // this.p = this.pic
      document.getElementById('profileImg').click()
      document.getElementById('uploadProfileBtn').style.display = "none"
      document.getElementById('saveProfileBtn').style.display = "flex"
    },

    async savePic() {// Otherwise create a profile
      const imgUrl = await this.$gf.media.store(this.url);
      // console.log(imgUrl)
      this.$gf.post({
        type: 'Profile',
        icon: {
          type: 'Image',
          magnet: [imgUrl]
        }
      })
      console.log("profile >> ", this.profile)

      document.getElementById('uploadProfileBtn').style.display = "flex"
      document.getElementById('saveProfileBtn').style.display = "none"
      

      // Exit the editing state
      this.editing = false
    },

    onProfileUpload(event) {
      const image = document.getElementById('profilePic');
      this.url = event.target.files[0];
      this.pic = URL.createObjectURL(this.url);
    },
  },

  

  template: '#profile'
}

app.components = { Name, Like, Read, Reply, Profile }
Vue.createApp(app)
   .use(GraffitiPlugin(Vue))
   .mount('#app')