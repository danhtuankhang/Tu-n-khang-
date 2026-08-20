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
    
    new SlashCommandBuilder().setName('addtester')
        .setDescription('Thêm một Tester vào hàng đợi Queue theo mode')
        .addStringOption(opt => opt.setName('mode').setDescription('Chọn mode').setRequired(true).addChoices(...MODE_LIST.map(m => ({ name: m, value: m.toLowerCase() }))))
        .addUserOption(opt => opt.setName('tester').setDescription('Tester cần thêm vào hàng đợi').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder().setName('tophopvanill').setDescription('Xem danh sách tổng hợp'),
    new SlashCommandBuilder().setName('taotick').setDescription('Tạo channel ticket').addUserOption(opt => opt.setName('player').setDescription('Người chơi').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('dongtick').setDescription('Đóng ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    new SlashCommandBuilder().setName('lenhang')
        .setDescription('Cập nhật kết quả lên hạng cho người chơi')
        .addUserOption(opt => opt.setName('player').setDescription('Người chơi được test').setRequired(true))
        .addUserOption(opt => opt.setName('tester').setDescription('Tester (Người kiểm tra)').setRequired(true))
        .addStringOption(opt => opt.setName('ign').setDescription('Tên trong game (IGN Minecraft)').setRequired(true))
        .addStringOption(opt => opt.setName('mode').setDescription('Chế độ chơi (Mode)').setRequired(true).addChoices(
            { name: 'Sword', value: 'Sword' }, { name: 'SMP', value: 'SMP' },
            { name: 'Vanilla', value: 'Vanilla' }, { name: 'NetheritePot', value: 'NetheritePot' },
            { name: 'Axe', value: 'Axe' }, { name: 'Mace', value: 'Mace' },
            { name: 'UHC', value: 'UHC' }, { name: 'DiamondPot', value: 'DiamondPot' }
        ))
        .addStringOption(opt => opt.setName('previous_rank').setDescription('Rank cũ (Trước khi test)').setRequired(true).addChoices(
            { name: 'Unranked (Chưa có)', value: 'Unranked' },
            { name: 'Low Tier 5', value: 'LT5' }, { name: 'Low Tier 4', value: 'LT4' }, { name: 'Low Tier 3', value: 'LT3' }, { name: 'Low Tier 2', value: 'LT2' }, { name: 'Low Tier 1', value: 'LT1' },
            { name: 'High Tier 5', value: 'HT5' }, { name: 'High Tier 4', value: 'HT4' }, { name: 'High Tier 3', value: 'HT3' }, { name: 'High Tier 2', value: 'HT2' }, { name: 'High Tier 1', value: 'HT1' }
        ))
        .addStringOption(opt => opt.setName('rank').setDescription('Rank mới (Rank đạt được)').setRequired(true).addChoices(
            { name: 'Low Tier 5', value: 'LT5' }, { name: 'Low Tier 4', value: 'LT4' }, { name: 'Low Tier 3', value: 'LT3' }, { name: 'Low Tier 2', value: 'LT2' }, { name: 'Low Tier 1', value: 'LT1' },
            { name: 'High Tier 5', value: 'HT5' }, { name: 'High Tier 4', value: 'HT4' }, { name: 'High Tier 3', value: 'HT3' }, { name: 'High Tier 2', value: 'HT2' }, { name: 'High Tier 1', value: 'HT1' }
        ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

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
                await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            } 
            else if (commandName === 'taorolexacminh') {
                if (!interaction.guild.roles.cache.find(r => r.name === 'Verified')) await interaction.guild.roles.create({ name: 'Verified', color: '#00FF00' });
                await interaction.reply({ content: 'Đã tạo/kiểm tra xong Role Verified!', ephemeral: true });
            } 
            else if (commandName === 'taoroletestermode') {
                for (const m of MODE_LIST) {
                    if (!interaction.guild.roles.cache.find(r => r.name === `${m} Tester`)) {
                        await interaction.guild.roles.create({ name: `${m} Tester`, color: '#9B59B6' });
                    }
                }
                await interaction.reply({ content: 'Đã tạo xong các role Tester mode!', ephemeral: true });
            } 
            else if (commandName === 'taorolehethong') {
                for (const rName of ['LT5', 'LT4', 'LT3', 'LT2', 'HT5', 'HT4', 'HT3', 'HT2', 'Tester', 'Player']) {
                    if (!interaction.guild.roles.cache.find(r => r.name === rName)) {
                        await interaction.guild.roles.create({ name: rName, color: '#9B59B6' });
                    }
                }
                await interaction.reply({ content: 'Đã tạo xong các role hệ thống!', ephemeral: true });
            } 
            else if (commandName === 'queue' || commandName === 'closequeue') {
                const modeLower = interaction.options.getString('mode');
                const matched = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];
                
                qObj.isOpen = (commandName === 'queue');
                if (qObj.isOpen) { 
                    qObj.players = []; 
                    if (!qObj.testers.includes(interaction.user.id)) {
                        qObj.testers.push(interaction.user.id);
                    }
                }
                qObj.channelId = interaction.channelId;
                
                const embed = qObj.isOpen ? buildQueueEmbed(matched, qObj) : new EmbedBuilder().setColor('#FF0000').setTitle(`No Testers Online ${matched}`).setDescription('Queue closed.');
                const row = qObj.isOpen ? new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`join_${modeLower}`).setLabel('Join Queue').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`leave_${modeLower}`).setLabel('Leave Queue').setStyle(ButtonStyle.Danger)
                ) : null;
                
                await interaction.reply({ embeds: [embed], components: row ? [row] : [] });
                const replyMsg = await interaction.fetchReply();
                qObj.messageId = replyMsg.id;
            } 
            else if (commandName === 'addtester') {
                const modeLower = interaction.options.getString('mode');
                const testerUser = interaction.options.getUser('tester');
                const matched = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];

                if (!qObj.testers.includes(testerUser.id)) {
                    qObj.testers.push(testerUser.id);
                }

                if (qObj.messageId && qObj.channelId) {
                    try {
                        const ch = await interaction.guild.channels.fetch(qObj.channelId);
                        const msg = await ch.messages.fetch(qObj.messageId);
                        await msg.edit({ embeds: [buildQueueEmbed(matched, qObj)] });
                    } catch (e) {}
                }

                await interaction.reply({ content: `Đã thêm <@${testerUser.id}> vào danh sách Tester của mode **${matched}**!`, ephemeral: true });
            } 
            else if (commandName === 'taotick') {
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
                await ch.send({ content: `<@${player.id}> <@${interaction.user.id}>`, embeds: [new EmbedBuilder().setColor('#00FF00'].setTitle(`Ticket - ${mode}`)] });
                await interaction.reply({ content: `Đã tạo ticket: <#${ch.id}>`, ephemeral: true });
            } 
            else if (commandName === 'dongtick') {
                if (!interaction.channel.name.startsWith('ticket-')) {
                    return interaction.reply({ content: 'Lệnh này chỉ dùng được trong kênh ticket!', ephemeral: true });
                }
                await interaction.reply({ content: 'Đang đóng ticket trong 3 giây...', ephemeral: true });
                setTimeout(async () => {
                    try {
                        await interaction.channel.delete('Ticket closed');
                    } catch (err) {
                        console.error(err);
                    }
                }, 3000);
            } 
            else if (commandName === 'lenhang') {
                const player = interaction.options.getUser('player');
                const tester = interaction.options.getUser('tester');
                const ign = interaction.options.getString('ign');
                const mode = interaction.options.getString('mode');
                const prevRankCode = interaction.options.getString('previous_rank');
                const rankCode = interaction.options.getString('rank');

                const getRankFullName = (code) => {
                    if (code === 'Unranked') return 'Unranked';
                    if (code.startsWith('LT')) return `Low Tier ${code.replace('LT', '')}`;
                    if (code.startsWith('HT')) return `High Tier ${code.replace('HT', '')}`;
                    return code;
                };

                const modeEmojis = {
                    'Sword': '⚔️', 'SMP': '🌍', 'Vanilla': '🌿', 'NetheritePot': '🧪',
                    'Axe': '🪓', 'Mace': '🔨', 'UHC': '❤️', 'DiamondPot': '💎'
                };

                const embed = new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setAuthor({ name: `${ign}'s Test Results 🏆`, iconURL: player.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(`https://minotar.net/armor/bust/${ign}/100.png`)
                    .setDescription(`**Tester**\n<@${tester.id}>\n\n**Username**\n${ign}\n\n**Mode**\n${modeEmojis[mode] || '🎮'} ${mode}\n\n**Previous Rank**\n${getRankFullName(prevRankCode)}\n\n**Rank Earned**\n${getRankFullName(rankCode)}`);

                await interaction.reply({ embeds: [embed] });

                const rGive = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === rankCode.toLowerCase());
                if (rGive) { 
                    try { 
                        const member = await interaction.guild.members.fetch(player.id);
                        await member.roles.add(rGive); 
                        if (prevRankCode !== 'Unranked') {
                            const rRemove = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === prevRankCode.toLowerCase());
                            if (rRemove && rRemove.id !== rGive.id) await member.roles.remove(rRemove);
                        }
                    } catch(e) { console.error("Lỗi cấp role:", e); } 
                }
            } 
            else {
                await interaction.reply({ content: 'Thực hiện thành công!', ephemeral: true });
            }
        } 
        else if (interaction.isButton()) {
            if (interaction.customId === 'btn_open_verify_modal') {
                const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verify Account');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('IGN').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('server_region').setLabel('Server').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('account_type').setLabel('Premium/Cracked').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
            } 
            else if (interaction.customId === 'btn_enter_waitlist') {
                const menu = new StringSelectMenuBuilder().setCustomId('select_mode_waitlist').setPlaceholder('Chọn mode...').addOptions(MODE_LIST.map(m => new StringSelectMenuOptionBuilder().setLabel(m).setValue(m)));
                await interaction.reply({ content: 'Chọn mode:', components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
            } 
            else if (interaction.customId.startsWith('join_') || interaction.customId.startsWith('leave_')) {
                const [action, modeLower] = interaction.customId.split('_');
                const matched = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];
                if (action === 'join' && !qObj.players.includes(interaction.user.id)) qObj.players.push(interaction.user.id);
                if (action === 'leave') qObj.players = qObj.players.filter(id => id !== interaction.user.id);
                await interaction.update({ embeds: [buildQueueEmbed(matched, qObj)] });
            }
        } 
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_mode_waitlist') {
                const mode = interaction.values[0];
                let role = interaction.guild.roles.cache.find(r => r.name === mode);
                if (!role) role = await interaction.guild.roles.create({ name: mode, color: '#9B59B6' });
                try { await interaction.member.roles.add(role); } catch(e){}
                await interaction.update({ content: 'Đã nhận role mode thành công!', components: [] });
            }
        } 
        else if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {
            await interaction.reply({ content: 'Xác minh thành công!', ephemeral: true });
            let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
            if (role) { try { await interaction.member.roles.add(role); } catch(e){} }
        }
    } catch (e) { 
        console.error("Lỗi tương tác:", e); 
    }
});

client.login(TOKEN);

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running successfully!');
});
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP Server is running on port ${PORT}`);
});
