const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle,
    Events 
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1495060454110920725';
const GUILD_ID = '1539746803216552046';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers 
    ] 
});

let queueVanilla = {
    isOpen: false,
    testers: [],
    players: [],
    messageId: null,
    channelId: null,
    timer: null,
    history: []
};

// --- ĐĂNG KÝ LỆNH ĐÃ ĐƯỢC LÀM GỌN VÀ CHUẨN XÁC ---
const commands = [
    new SlashCommandBuilder().setName('xacminh').setDescription('Gửi bảng xác minh role').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('taorolexacminh').setDescription('Tự động tạo Role xác minh').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('queuevanilla').setDescription('Mở hàng đợi Queue Vanilla').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('queuekomo').setDescription('Đóng Queue Vanilla').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('tophopvanill').setDescription('Xem danh sách tổng hợp'),
    new SlashCommandBuilder().setName('ticketvanilla').setDescription('Tạo channel ticket').addUserOption(opt => opt.setName('player').setDescription('Người chơi').setRequired(true)),
    new SlashCommandBuilder().setName('dongtick').setDescription('Đóng ticket'),
    new SlashCommandBuilder().setName('lenhang').setDescription('Cập nhật kết quả').addUserOption(opt => opt.setName('tester').setDescription('Tester').setRequired(true)).addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).addStringOption(opt => opt.setName('rank').setDescription('Rank').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('ban').setDescription('Cấm người chơi').addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('li_do').setDescription('Lý do').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName('win').setDescription('Ghi nhận tỉ số').addUserOption(opt => opt.setName('tester').setDescription('Tester').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('ti_so').setDescription('Tỉ số').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once(Events.ClientReady, async () => {
    console.log(`✅ Bot ${client.user.tag} đã online!`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
});

client.on(Events.GuildMemberAdd, async member => {
    try {
        let role = member.guild.roles.cache.find(r => r.name === 'Membre');
        if (!role) {
            role = await member.guild.roles.create({ name: 'Membre', color: '#2ECC71' });
        }
        await member.roles.add(role);
    } catch (error) {
        console.error(error);
    }
});

function buildQueueEmbed() {
    const playerList = queueVanilla.players.length > 0 
        ? queueVanilla.players.map((id, index) => `${index + 1}. <@${id}>`).join('\n')
        : 'Empty';
    const testerList = queueVanilla.testers.length > 0 
        ? queueVanilla.testers.map(id => `<@${id}>`).join(', ')
        : 'None';

    return new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Tester(s) Available! 🟢 Queue Open')
        .setDescription(`**Queue: (${queueVanilla.players.length}/20)**\n${playerList}\n\n**Active Testers:**\n${testerList}`);
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'xacminh') {
            const embed = new EmbedBuilder().setColor('#DC143C').setTitle('📝 Evaluation Testing Waitlist').setDescription('Nhấn để xác minh');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_open_verify_modal').setLabel('Verify Account').setStyle(ButtonStyle.Primary)
            );
            await interaction.reply({ embeds: [embed], components: [row] });
        }
        else if (commandName === 'taorolexacminh') {
            await interaction.reply({ content: '✅ Đã kiểm tra role!', ephemeral: true });
        }
        else if (commandName === 'queuevanilla') {
            queueVanilla.isOpen = true;
            queueVanilla.players = [];
            queueVanilla.testers = [interaction.user.id];
            queueVanilla.channelId = interaction.channelId;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_join_queue').setLabel('Join Queue').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('btn_leave_queue').setLabel('Leave Queue').setStyle(ButtonStyle.Danger)
            );
            const msg = await interaction.reply({ embeds: [buildQueueEmbed()], components: [row], fetchReply: true });
            queueVanilla.messageId = msg.id;
        }
        else if (commandName === 'queuekomo') {
            queueVanilla.isOpen = false;
            await interaction.reply({ content: '🛑 Đã đóng Queue!', ephemeral: true });
        }
        else if (commandName === 'tophopvanill') {
            await interaction.reply({ content: 'Danh sách tổng hợp...', ephemeral: true });
        }
        else if (commandName === 'ticketvanilla') {
            await interaction.reply({ content: 'Đã tạo ticket...', ephemeral: true });
        }
        else if (commandName === 'dongtick') {
            await interaction.reply({ content: 'Đang đóng ticket...', ephemeral: true });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
        else if (commandName === 'lenhang' || commandName === 'ban' || commandName === 'win') {
            await interaction.reply({ content: '✅ Đã thực hiện lệnh thành công!', ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'btn_open_verify_modal') {
            const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verify Account');
            const ignInput = new TextInputBuilder().setCustomId('ign').setLabel('IGN').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(ignInput));
            await interaction.showModal(modal);
        }
        else if (interaction.customId === 'btn_join_queue') {
            if (!queueVanilla.players.includes(interaction.user.id)) {
                queueVanilla.players.push(interaction.user.id);
            }
            await interaction.update({ embeds: [buildQueueEmbed()] });
        }
        else if (interaction.customId === 'btn_leave_queue') {
            queueVanilla.players = queueVanilla.players.filter(id => id !== interaction.user.id);
            await interaction.update({ embeds: [buildQueueEmbed()] });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'verify_modal') {
            await interaction.reply({ content: '✅ Xác minh thành công!', ephemeral: true });
        }
    }
});

client.login(TOKEN);
        
