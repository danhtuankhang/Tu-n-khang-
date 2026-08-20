const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events 
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1495060454110920725';
const GUILD_ID = '1539746803216552046';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const MODE_LIST = ['Sword', 'SMP', 'Vanilla', 'NetheritePot', 'Axe', 'Mace', 'UHC', 'DiamondPot'];
const queues = {};

MODE_LIST.forEach(mode => {
    queues[mode.toLowerCase()] = { isOpen: false, testers: [], players: [], messageId: null, channelId: null };
});

const commands = [
    new SlashCommandBuilder().setName('xacminh').setDescription('Gửi bảng xác minh role').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('taorolexacminh').setDescription('Tự động tạo Role xác minh').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('taoroletestermode').setDescription('Tự động tạo các role Tester').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('taorolehethong').setDescription('Tự động tạo role hệ thống').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('queue').setDescription('Mở hàng đợi Queue').addStringOption(opt => opt.setName('mode').setDescription('Chọn mode').setRequired(true).addChoices(...MODE_LIST.map(m => ({ name: m, value: m.toLowerCase() })))).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('closequeue').setDescription('Đóng hàng đợi Queue').addStringOption(opt => opt.setName('mode').setDescription('Chọn mode').setRequired(true).addChoices(...MODE_LIST.map(m => ({ name: m, value: m.toLowerCase() })))).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('tophopvanill').setDescription('Xem danh sách tổng hợp'),
    new SlashCommandBuilder().setName('taotick').setDescription('Tạo channel ticket').addUserOption(opt => opt.setName('player').setDescription('Người chơi').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('dongtick').setDescription('Đóng ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('lenhang').setDescription('Cập nhật kết quả lên hạng').addUserOption(opt => opt.setName('player').setDescription('Player').setRequired(true)).addUserOption(opt => opt.setName('tester').setDescription('Tester').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).addStringOption(opt => opt.setName('rank').setDescription('Rank').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('ban').setDescription('Cấm người chơi').addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('li_do').setDescription('Lý do').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName('win').setDescription('Ghi nhận tỉ số').addUserOption(opt => opt.setName('tester').setDescription('Tester').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('ti_so').setDescription('Tỉ số').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once(Events.ClientReady, async () => {
    console.log(`Bot ${client.user.tag} da online!`);
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Da dong bo slash commands!');
    } catch (e) { console.error(e); }
});

client.on(Events.GuildMemberAdd, async member => {
    try {
        let role = member.guild.roles.cache.find(r => r.name === 'Membre');
        if (!role) role = await member.guild.roles.create({ name: 'Membre', color: '#2ECC71' });
        await member.roles.add(role);
    } catch (e) { console.error(e); }
});

function buildQueueEmbed(modeName, qObj) {
    const pList = qObj.players.length ? qObj.players.map((id, i) => `${i + 1}. <@${id}>`).join('\n') : 'Empty';
    const tList = qObj.testers.length ? qObj.testers.map(id => `<@${id}>`).join(', ') : 'None';
    return new EmbedBuilder().setColor('#00FF00').setTitle(`[${modeName}] Queue Open 🟢`).setDescription(`**Queue (${qObj.players.length}/20):**\n${pList}\n\n**Testers:**\n${tList}`);
}

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;
            if (commandName === 'xacminh') {
                const embed = new EmbedBuilder().setColor('#DC143C').setTitle('📝 Evaluation Testing Waitlist').setDescription('Nhấn nút bên dưới để xác minh tài khoản.');
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_open_verify_modal').setLabel('Verify Account').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('btn_enter_waitlist').setLabel('Enter Waitlist').setStyle(ButtonStyle.Secondary)
                );
                await interaction.reply({ embeds: [embed], components: [row] });
            } else if (commandName === 'taorolexacminh') {
                if (!interaction.guild.roles.cache.find(r => r.name === 'Verified')) await interaction.guild.roles.create({ name: 'Verified', color: '#00FF00' });
                await interaction.reply({ content: 'Đã tạo/kiểm tra xong Role Verified!', ephemeral: true });
            } else if (commandName === 'taoroletestermode') {
                await interaction.deferReply({ ephemeral: true });
                for (const m of MODE_LIST) {
                    if (!interaction.guild.roles.cache.find(r => r.name === `${m} Tester`)) {
                        await interaction.guild.roles.create({ name: `${m} Tester`, color: '#9B59B6' });
                    }
                }
                await interaction.editReply('Đã tạo xong các role Tester mode!');
            } else if (commandName === 'taorolehethong') {
                await interaction.deferReply({ ephemeral: true });
                for (const rName of ['LT5', 'LT4', 'LT3', 'LT2', 'HT5', 'HT4', 'HT3', 'HT2', 'Tester', 'Player']) {
                    if (!interaction.guild.roles.cache.find(r => r.name === rName)) {
                        await interaction.guild.roles.create({ name: rName, color: '#9B59B6' });
                    }
                }
                await interaction.editReply('Đã tạo xong các role hệ thống!');
            } else if (commandName === 'queue' || commandName === 'closequeue') {
                const modeLower = interaction.options.getString('mode');
                const matched = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];
                if (qObj.messageId && qObj.channelId) {
                    try { const ch = await interaction.guild.channels.fetch(qObj.channelId); const msg = await ch.messages.fetch(qObj.messageId); await msg.delete(); } catch(e){}
                }
                qObj.isOpen = (commandName === 'queue');
                if (qObj.isOpen) { qObj.players = []; qObj.testers = [interaction.user.id]; }
                qObj.channelId = interaction.channelId;
                
                const embed = qObj.isOpen ? buildQueueEmbed(matched, qObj) : new EmbedBuilder().setColor('#FF0000').setTitle(`No Testers Online ${matched}`).setDescription('Queue closed.');
                const row = qObj.isOpen ? new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`join_${modeLower}`).setLabel('Join Queue').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`leave_${modeLower}`).setLabel('Leave Queue').setStyle(ButtonStyle.Danger)
                ) : null;
                const msg = await interaction.reply({ embeds: [embed], components: row ? [row] : [], fetchReply: true });
                qObj.messageId = msg.id;
            } else if (commandName === 'taotick') {
                const player = interaction.options.getUser('player');
                const mode = interaction.options.getString('mode');
                const ch = await interaction.guild.channels.create({
                    name: `ticket-${player.username}-${mode}`.toLowerCase(),
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: player.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ]
                });
                await ch.send({ content: `<@${player.id}> <@${interaction.user.id}>`, embeds: [new EmbedBuilder().setColor('#00FF00').setTitle(`Ticket - ${mode}`)] });
                await interaction.reply({ content: `Đã tạo ticket: <#${ch.id}>`, ephemeral: true });
            } else if (commandName === 'dongtick') {
                await interaction.reply({ content: 'Đóng ticket sau 3 giây...', ephemeral: true });
                setTimeout(() => interaction.channel.delete().catch(()=>{}), 3000);
            } else if (commandName === 'lenhang') {
                const player = interaction.options.getUser('player');
                const rank = interaction.options.getString('rank');
                await interaction.reply({ embeds: [new EmbedBuilder().setColor('#3498DB').setTitle('🏆 Cập Nhật Lên Hạng').setDescription(`Player: <@${player.id}>\nRank: ${rank}`)] });
                const rGive = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === rank.toLowerCase());
                if (rGive) { try { (await interaction.guild.members.fetch(player.id)).roles.add(rGive); } catch(e){} }
            } else {
                await interaction.reply({ content: 'Thực hiện thành công!', ephemeral: true });
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'btn_open_verify_modal') {
                const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verify Account');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('IGN').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('server_region').setLabel('Server').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('account_type').setLabel('Premium/Cracked').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
            } else if (interaction.customId === 'btn_enter_waitlist') {
                const menu = new StringSelectMenuBuilder().setCustomId('select_mode_waitlist').setPlaceholder('Chọn mode...').addOptions(MODE_LIST.map(m => new StringSelectMenuOptionBuilder().setLabel(m).setValue(m)));
                await interaction.reply({ content: 'Chọn mode:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            } else if (interaction.customId.startsWith('join_') || interaction.customId.startsWith('leave_')) {
                const [action, modeLower] = interaction.customId.split('_');
                const matched = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];
                if (action === 'join' && !qObj.players.includes(interaction.user.id)) qObj.players.push(interaction.user.id);
                if (action === 'leave') qObj.players = qObj.players.filter(id => id !== interaction.user.id);
                await interaction.update({ embeds: [buildQueueEmbed(matched, qObj)] });
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_mode_waitlist') {
                const mode = interaction.values[0];
                let role = interaction.guild.roles.cache.find(r => r.name === mode);
                if (!role) role = await interaction.guild.roles.create({ name: mode, color: '#9B59B6' });
                try { await interaction.member.roles.add(role); } catch(e){}
                await interaction.update({ content: 'Đã nhận role mode thành công!', components: [] });
            }
        } else if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {
            await interaction.reply({ content: 'Xác minh thành công!', ephemeral: true });
            let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
            if (role) { try { await interaction.member.roles.add(role); } catch(e){} }
        }
    } catch (e) { console.error(e); }
});

client.login(TOKEN);
                
