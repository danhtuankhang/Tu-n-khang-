const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events 
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

const MODE_LIST = ['Sword', 'SMP', 'Vanilla', 'NetheritePot', 'Axe', 'Mace', 'UHC', 'DiamondPot'];

const queues = {};
MODE_LIST.forEach(mode => {
    queues[mode.toLowerCase()] = {
        isOpen: false,
        testers: [],
        players: [],
        messageId: null,
        channelId: null
    };
});

const commands = [
    new SlashCommandBuilder().setName('xacminh').setDescription('Gửi bảng xác minh role').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('taorolexacminh').setDescription('Tự động tạo Role xác minh').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('taoroletestermode').setDescription('Tự động tạo các role [Mode] Tester màu tím').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('taorolehethong').setDescription('Tự động tạo role Tester, Player và các Rank lên hạng màu tím').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    // Lệnh /queue có danh sách lựa chọn mode trực quan
    new SlashCommandBuilder().setName('queue')
        .setDescription('Mở hàng đợi Queue theo mode')
        .addStringOption(opt => 
            opt.setName('mode')
               .setDescription('Chọn mode để mở')
               .setRequired(true)
               .addChoices(
                   { name: 'Sword', value: 'sword' },
                   { name: 'SMP', value: 'smp' },
                   { name: 'Vanilla', value: 'vanilla' },
                   { name: 'NetheritePot', value: 'netheritepot' },
                   { name: 'Axe', value: 'axe' },
                   { name: 'Mace', value: 'mace' },
                   { name: 'UHC', value: 'uhc' },
                   { name: 'DiamondPot', value: 'diamondpot' }
               ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    // Lệnh /closequeue có danh sách lựa chọn mode trực quan
    new SlashCommandBuilder().setName('closequeue')
        .setDescription('Đóng hàng đợi Queue theo mode')
        .addStringOption(opt => 
            opt.setName('mode')
               .setDescription('Chọn mode để đóng')
               .setRequired(true)
               .addChoices(
                   { name: 'Sword', value: 'sword' },
                   { name: 'SMP', value: 'smp' },
                   { name: 'Vanilla', value: 'vanilla' },
                   { name: 'NetheritePot', value: 'netheritepot' },
                   { name: 'Axe', value: 'axe' },
                   { name: 'Mace', value: 'mace' },
                   { name: 'UHC', value: 'uhc' },
                   { name: 'DiamondPot', value: 'diamondpot' }
               ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder().setName('tophopvanill').setDescription('Xem danh sách tổng hợp'),
    new SlashCommandBuilder().setName('taotick')
        .setDescription('Tạo channel ticket theo mode cho người chơi')
        .addUserOption(opt => opt.setName('player').setDescription('Người chơi').setRequired(true))
        .addStringOption(opt => opt.setName('mode').setDescription('Chế độ chơi (Mode)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('dongtick')
        .setDescription('Đóng ticket hiện tại')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('lenhang')
        .setDescription('Cập nhật kết quả test lên hạng')
        .addUserOption(opt => opt.setName('player').setDescription('Người chơi được test').setRequired(true))
        .addUserOption(opt => opt.setName('tester').setDescription('Người kiểm tra (Tester)').setRequired(true))
        .addStringOption(opt => opt.setName('mode').setDescription('Chế độ chơi (Mode)').setRequired(true))
        .addStringOption(opt => opt.setName('rank').setDescription('Rank (LT/HT từ 5 đến 2)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('ban').setDescription('Cấm người chơi').addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('li_do').setDescription('Lý do').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName('win').setDescription('Ghi nhận tỉ số').addUserOption(opt => opt.setName('tester').setDescription('Tester').setRequired(true)).addStringOption(opt => opt.setName('mode').setDescription('Mode').setRequired(true)).addStringOption(opt => opt.setName('ign').setDescription('IGN').setRequired(true)).addStringOption(opt => opt.setName('ti_so').setDescription('Tỉ số').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once(Events.ClientReady, async () => {
    console.log(`✅ Bot ${client.user.tag} đã online!`);
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('✅ Đã đồng bộ slash commands thành công!');
    } catch (error) {
        console.error('❌ Lỗi đồng bộ commands:', error);
    }
});

client.on(Events.GuildMemberAdd, async member => {
    try {
        let role = member.guild.roles.cache.find(r => r.name === 'Membre');
        if (!role) {
            role = await member.guild.roles.create({ name: 'Membre', color: '#2ECC71' });
        }
        await member.roles.add(role);
    } catch (error) {
        console.error('Lỗi khi thêm role thành viên mới:', error);
    }
});

function buildQueueEmbed(modeName, queueObj) {
    const playerList = queueObj.players.length > 0 
        ? queueObj.players.map((id, index) => `${index + 1}. <@${id}>`).join('\n')
        : 'Empty';
    const testerList = queueObj.testers.length > 0 
        ? queueObj.testers.map(id => `<@${id}>`).join(', ')
        : 'None';

    return new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`[${modeName}] Tester(s) Available! 🟢 Queue Open`)
        .setDescription(`**Queue: (${queueObj.players.length}/20)**\n${playerList}\n\n**Active Testers:**\n${testerList}`);
}

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            if (commandName === 'xacminh') {
                const embed = new EmbedBuilder()
                    .setColor('#DC143C')
                    .setTitle('📝 Evaluation Testing Waitlist')
                    .setDescription('Upon applying, you will be added to a waitlist channel.\nHere you will be pinged when a tester of your region is available.');
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_open_verify_modal').setLabel('Verify Account').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('btn_enter_waitlist').setLabel('Enter Waitlist').setStyle(ButtonStyle.Secondary)
                );
                await interaction.reply({ embeds: [embed], components: [row] });
            }
            else if (commandName === 'taorolexacminh') {
                let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
                if (!role) {
                    await interaction.guild.roles.create({ name: 'Verified', color: '#00FF00', reason: 'Tạo role xác minh' });
                }
                await interaction.reply({ content: '✅ Đã tạo/kiểm tra xong Role Verified!', ephemeral: true });
            }
            else if (commandName === 'taoroletestermode') {
                await interaction.deferReply({ ephemeral: true });
                let createdRoles = [];
                for (const modeName of MODE_LIST) {
                    const roleName = `${modeName} Tester`;
                    let existingRole = interaction.guild.roles.cache.find(r => r.name === roleName);
                    if (!existingRole) {
                        try {
                            await interaction.guild.roles.create({ name: roleName, color: '#9B59B6', reason: 'Tạo role tester mode màu tím' });
                            createdRoles.push(roleName);
                        } catch (err) { console.error(err); }
                    }
                }
                await interaction.editReply(`✅ Đã tạo các role Tester màu tím: ${createdRoles.length > 0 ? createdRoles.join(', ') : 'Đã tồn tại từ trước!'}`);
            }
            else if (commandName === 'taorolehethong') {
                await interaction.deferReply({ ephemeral: true });
                const ranks = ['LT5', 'LT4', 'LT3', 'LT2', 'HT5', 'HT4', 'HT3', 'HT2', 'Tester', 'Player'];
                let createdRoles = [];
                for (const rName of ranks) {
                    let existing = interaction.guild.roles.cache.find(r => r.name === rName);
                    if (!existing) {
                        try {
                            await interaction.guild.roles.create({ name: rName, color: '#9B59B6', reason: 'Tạo role hệ thống màu tím' });
                            createdRoles.push(rName);
                        } catch (err) { console.error(err); }
                    }
                }
                await interaction.editReply(`✅ Đã tạo các role hệ thống màu tím: ${createdRoles.length > 0 ? createdRoles.join(', ') : 'Đã tồn tại từ trước!'}`);
            }
            else if (commandName === 'queue') {
                const modeLower = interaction.options.getString('mode');
                const matchedMode = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];

                // Nếu đã có tin nhắn queue/close trước đó, tự động xóa đi
                if (qObj.messageId && qObj.channelId) {
                    try {
                        const oldChannel = await interaction.guild.channels.fetch(qObj.channelId);
                        const oldMsg = await oldChannel.messages.fetch(qObj.messageId);
                        await oldMsg.delete();
                    } catch (e) {
                        // Bỏ qua nếu không tìm thấy tin nhắn cũ
                    }
                }

                qObj.isOpen = true;
                qObj.players = [];
                qObj.testers = [interaction.user.id];
                qObj.channelId = interaction.channelId;

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`join_${modeLower}`).setLabel('Join Queue').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`leave_${modeLower}`).setLabel('Leave Queue').setStyle(ButtonStyle.Danger)
                );
                const msg = await interaction.reply({ embeds: [buildQueueEmbed(matchedMode, qObj)], components: [row], fetchReply: true });
                qObj.messageId = msg.id;
            }
            else if (commandName === 'closequeue') {
                const modeLower = interaction.options.getString('mode');
                const matchedMode = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                const qObj = queues[modeLower];

                // Xóa tin nhắn queue đang mở (nếu có) trước khi gửi bảng đóng
                if (qObj.messageId && qObj.channelId) {
                    try {
                        const oldChannel = await interaction.guild.channels.fetch(qObj.channelId);
                        const oldMsg = await oldChannel.messages.fetch(qObj.messageId);
                        await oldMsg.delete();
                    } catch (e) {
                        // Bỏ qua nếu không tìm thấy
                    }
                }

                qObj.isOpen = false;

                // Tạo bảng thông báo đóng giống như hình mẫu bạn cung cấp
                const closedEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(`No Testers Online ${matchedMode}`)
                    .setDescription(`No testers for ${matchedMode} are available at this time.\nYou will be pinged when a tester is available.\nCheck back later!`)
                    .setFooter({ text: `Last testing session: ${new Date().toLocaleString('vi-VN')}` });

                const msg = await interaction.reply({ embeds: [closedEmbed], fetchReply: true });
                
                // Lưu lại ID của thông báo đóng để lần sau mở queue mới sẽ xóa bảng đóng này đi
                qObj.messageId = msg.id;
                qObj.channelId = interaction.channelId;
            }
            else if (commandName === 'tophopvanill') {
                await interaction.reply({ content: 'Danh sách tổng hợp...', ephemeral: true });
            }
            else if (commandName === 'taotick') {
                const player = interaction.options.getUser('player');
                const mode = interaction.options.getString('mode');
                const guild = interaction.guild;

                const ticketChannel = await guild.channels.create({
                    name: `ticket-${player.username}-${mode}`.toLowerCase(),
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: player.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`🎫 Ticket Test - Mode: ${mode}`)
                    .setDescription(`Xin chào <@${player.id}> và <@${interaction.user.id}>!`);

                await ticketChannel.send({ content: `<@${player.id}> <@${interaction.user.id}>`, embeds: [embed] });
                await interaction.reply({ content: `✅ Đã tạo thành công ticket: <#${ticketChannel.id}>`, ephemeral: true });
            }
            else if (commandName === 'dongtick') {
                const channel = interaction.channel;
                await interaction.reply({ content: '🔒 Ticket sẽ được đóng sau 3 giây nữa...', ephemeral: true });
                setTimeout(() => channel.delete().catch(() => {}), 3000);
            }
            else if (commandName === 'lenhang') {
                const player = interaction.options.getUser('player');
                const tester = interaction.options.getUser('tester');
                const mode = interaction.options.getString('mode');
                const rank = interaction.options.getString('rank');

                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('🏆 Cập Nhật Kết Quả Test Lên Hạng')
                    .addFields(
                        { name: '👤 Người chơi', value: `<@${player.id}>`, inline: true },
                        { name: '🛡️ Tester', value: `<@${tester.id}>`, inline: true },
                        { name: '⚔️ Mode', value: mode, inline: true },
                        { name: '🎖️ Rank Đạt Được', value: rank, inline: true }
                    );

                await interaction.reply({ embeds: [embed] });
                let roleToGive = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === rank.toLowerCase());
                if (roleToGive) {
                    try {
                        const member = await interaction.guild.members.fetch(player.id);
                        await member.roles.add(roleToGive);
                    } catch (e) { console.error(e); }
                }
            }
            else if (commandName === 'ban' || commandName === 'win') {
                await interaction.reply({ content: '✅ Đã thực hiện lệnh thành công!', ephemeral: true });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'btn_open_verify_modal') {
                const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verify Account & Server');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('In-game name (IGN)').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('server_region').setLabel('Server muốn test').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('account_type').setLabel('Loại tài khoản (Premium / Cracked)').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await interaction.showModal(modal);
            }
            else if (interaction.customId === 'btn_enter_waitlist') {
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_mode_waitlist')
                    .setPlaceholder('Chọn mode...')
                    .addOptions(MODE_LIST.map(mode => new StringSelectMenuOptionBuilder().setLabel(mode).setValue(mode)));

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await interaction.reply({ content: 'Vui lòng chọn chế độ chơi (mode) bên dưới:', components: [row], ephemeral: true });
            }
            else if (interaction.customId.startsWith('join_')) {
                const modeLower = interaction.customId.replace('join_', '');
                const matchedMode = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                if (matchedMode) {
                    const qObj = queues[modeLower];
                    if (!qObj.players.includes(interaction.user.id)) {
                        qObj.players.push(interaction.user.id);
                    }
                    await interaction.update({ embeds: [buildQueueEmbed(matchedMode, qObj)] });
                }
            }
            else if (interaction.customId.startsWith('leave_')) {
                const modeLower = interaction.customId.replace('leave_', '');
                const matchedMode = MODE_LIST.find(m => m.toLowerCase() === modeLower);
                if (matchedMode) {
                    const qObj = queues[modeLower];
                    qObj.players = qObj.players.filter(id => id !== interaction.user.id);
                    await interaction.update({ embeds: [buildQueueEmbed(matchedMode, qObj)] });
                }
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_mode_waitlist') {
                const selectedMode = interaction.values[0];
                const guild = interaction.guild;
                const member = interaction.member;

                let role = guild.roles.cache.find(r => r.name === selectedMode);
            
