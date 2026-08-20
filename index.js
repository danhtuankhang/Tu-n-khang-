const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ChannelType 
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

// --- 1. ĐĂNG KÝ CÁC LỆNH ---
const commands = [
    new SlashCommandBuilder()
        .setName('xacminh')
        .setDescription('Gửi bảng xác minh role')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('taorolexacminh')
        .setDescription('Tự động tạo Role xác minh')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('queuevanilla')
        .setDescription('Mở hàng đợi Queue Vanilla trong 10 phút')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('queuekomo')
        .setDescription('Đóng Queue Vanilla ngay lập tức')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('tophopvanill')
        .setDescription('Xem danh sách tổng hợp những người đã tham gia Queue'),

    new SlashCommandBuilder()
        .setName('ticketvanilla')
        .setDescription('Tạo channel ticket test Vanilla riêng cho người chơi')
        .addUserOption(opt => opt.setName('player').setDescription('Người chơi cần test').setRequired(true)),

    new SlashCommandBuilder()
        .setName('dongtick')
        .setDescription('Đóng và xóa kênh ticket test riêng này'),

    new SlashCommandBuilder()
        .setName('lenhang')
        .setDescription('Cập nhật kết quả test và Lên Hạng cho người chơi')
        .addUserOption(opt => opt.setName('tester').setDescription('Chọn Tester thực hiện test').setRequired(true))
        .addStringOption(opt => opt.setName('ign').setDescription('Tên Minecraft của người chơi').setRequired(true))
        .addStringOption(opt => 
            opt.setName('mode')
               .setDescription('Chọn Mode test')
               .setRequired(true)
               .addChoices(
                   { name: 'Mace', value: 'Mace' },
                   { name: 'Vanilla', value: 'Vanilla' },
                   { name: 'Sword', value: 'Sword' },
                   { name: 'SMP', value: 'SMP' },
                   { name: 'NetheritePot', value: 'NetheritePot' },
                   { name: 'Axe', value: 'Axe' },
                   { name: 'UHC', value: 'UHC' },
                   { name: 'DiamondPot', value: 'DiamondPot' }
               )
        )
        .addStringOption(opt => 
            opt.setName('rank')
               .setDescription('Rank đạt được')
               .setRequired(true)
               .addChoices(
                   { name: 'High Tier 1', value: 'High Tier 1' },
                   { name: 'Low Tier 1', value: 'Low Tier 1' },
                   { name: 'High Tier 2', value: 'High Tier 2' },
                   { name: 'Low Tier 2', value: 'Low Tier 2' },
                   { name: 'High Tier 3', value: 'High Tier 3' },
                   { name: 'Low Tier 3', value: 'Low Tier 3' },
                   { name: 'High Tier 4', value: 'High Tier 4' },
                   { name: 'Low Tier 4', value: 'Low Tier 4' },
                   { name: 'High Tier 5', value: 'High Tier 5' },
                   { name: 'Low Tier 5', value: 'Low Tier 5' }
               )
        )
        .addStringOption(opt => opt.setName('previous_rank').setDescription('Rank cũ (Mặc định: Unranked)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Cấm (Ban) người chơi khỏi hệ thống test hoặc Discord')
        .addStringOption(opt => opt.setName('ign').setDescription('Tên Minecraft hoặc Discord Username').setRequired(true))
        .addStringOption(opt => opt.setName('li_do').setDescription('Lý do cấm').setRequired(true))
        .addUserOption(opt => opt.setName('user').setDescription('Tag tài khoản Discord người chơi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('win')
        .setDescription('Ghi nhận tỉ số trận test')
        .addUserOption(opt => opt.setName('tester').setDescription('Chọn Tester thực hiện test').setRequired(true))
        .addStringOption(opt => 
            opt.setName('mode')
               .setDescription('Chọn Mode test')
               .setRequired(true)
               .addChoices(
                   { name: 'Mace', value: 'Mace' },
                   { name: 'Vanilla', value: 'Vanilla' },
                   { name: 'Sword', value: 'Sword' },
                   { name: 'SMP', value: 'SMP' },
                   { name: 'NetheritePot', value: 'NetheritePot' },
                   { name: 'Axe', value: 'Axe' },
                   { name: 'UHC', value: 'UHC' },
                   { name: 'DiamondPot', value: 'DiamondPot' }
               )
        )
        .addStringOption(opt => opt.setName('ign').setDescription('Tên Minecraft của người chơi').setRequired(true))
        .addStringOption(opt => opt.setName('ti_so').setDescription('Tỉ số trận đấu (VD: 4:0 hoặc 0:0)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} đã online!`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
});

// --- 2. TỰ ĐỘNG CẤP ROLE MEMBRE KHI CÓ THÀNH VIÊN MỚI ---
client.on('guildMemberAdd', async member => {
    try {
        let role = member.guild.roles.cache.find(r => r.name === 'Membre');
        if (!role) {
            role = await member.guild.roles.create({
                name: 'Membre',
                color: '#2ECC71',
                reason: 'Tự động tạo Role Membre cho thành viên mới'
            });
        }
        await member.roles.add(role);
    } catch (error) {
        console.error(`❌ Lỗi cấp role Membre:`, error);
    }
});

// --- 3. HÀM GỬI EMBED KHI QUEUE ĐÓNG ---
async function sendClosedEmbed(channel) {
    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('No Testers Online Vanilla')
        .setDescription(
            'No testers for Vanilla are available at this time.\n' +
            'You will be pinged when a tester is available.\n' +
            'Check back later!'
        )
        .setFooter({ text: `Last testing session: ${new Date().toLocaleString('vi-VN')}` });

    return await channel.send({ embeds: [embed] });
}

// --- 4. HÀM XÂY DỰNG EMBED QUEUE ĐANG MỞ ---
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
        .setDescription(
            '⏱️ The queue updates automatically.\n' +
            'Click **Join Queue** to enter or **Leave Queue** to exit.\n\n' +
            `**Queue: (${queueVanilla.players.length}/20)**\n${playerList}\n\n` +
            `**Active Testers:**\n${testerList}`
        )
        .setFooter({ text: 'BossTier Premium by @bossne240' });
}

// --- 5. XỬ LÝ TƯƠNG TÁC VÀ LỆNH ---
client.on('interactionCreate', async interaction => {

    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // /xacminh
        if (commandName === 'xacminh') {
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🛡️ XÁC MINH TÀI KHOẢN & NHẬN ROLE')
                .setDescription('Nhấn vào nút bên dưới để hoàn tất xác minh vào server.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_verify').setLabel('Xác minh ngay').setStyle(ButtonStyle.Success)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }

        // /taorolexacminh
        else if (commandName === 'taorolexacminh') {
            try {
                let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
                if (!role) {
                    await interaction.guild.roles.create({ name: 'Verified', color: '#00FF00', reason: 'Tạo role xác minh' });
                }
                await interaction.reply({ content: '✅ Đã tạo/kiểm tra xong Role Xác Minh!', ephemeral: true });
            } catch (e) {
                await interaction.reply({ content: `❌ Lỗi: ${e.message}`, ephemeral: true });
            }
        }

        // /queuevanilla
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

            if (queueVanilla.timer) clearTimeout(queueVanilla.timer);
            queueVanilla.timer = setTimeout(async () => {
                if (queueVanilla.isOpen) {
                    queueVanilla.isOpen = false;
                    try {
                        const channel = await interaction.guild.channels.fetch(queueVanilla.channelId);
                        const oldMsg = await channel.messages.fetch(queueVanilla.messageId);
                        if (oldMsg) await oldMsg.delete();
                        await sendClosedEmbed(channel);
                    } catch (e) { console.error(e); }
                }
            }, 10 * 60 * 1000);
        }

        // /queuekomo
        else if (commandName === 'queuekomo') {
            if (!queueVanilla.isOpen) {
                return await interaction.reply({ content: '❌ Queue Vanilla hiện tại chưa mở!', ephemeral: true });
            }

            queueVanilla.isOpen = false;
            if (queueVanilla.timer) clearTimeout(queueVanilla.timer);

            try {
                const channel = interaction.channel;
                if (queueVanilla.messageId) {
                    const oldMsg = await channel.messages.fetch(queueVanilla.messageId);
                    if (oldMsg) await oldMsg.delete();
                }
            } catch (e) { console.error(e); }

            await interaction.reply({ content: '🛑 Đã đóng Queue thành công!', ephemeral: true });
            await sendClosedEmbed(interaction.channel);
        }

        // /tophopvanill
        else if (commandName === 'tophopvanill') {
            const list = queueVanilla.history.length > 0 
                ? queueVanilla.history.map((id, i) => `${i + 1}. <@${id}>`).join('\n')
                : 'Chưa có ai tham gia phiên test này.';

            const embed = new EmbedBuilder()
                .setColor('#1E90FF')
                .setTitle('📋 Danh sách tổng hợp người đã Join Queue Vanilla')
                .setDescription(list);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // /ticketvanilla
        else if (commandName === 'ticketvanilla') {
            const player = interaction.options.getUser('player');

            const ticketChannel = await interaction.guild.channels.create({
                name: `test-vanilla-${player.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: player.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            await ticketChannel.send({
                content: `👋 Chào mừng ${player} và Tester ${interaction.user}!\nKênh riêng dùng để tiến hành test Vanilla.`
            });

            await interaction.reply({ content: `✅ Đã tạo kênh test riêng: ${ticketChannel}`, ephemeral: true });
        }

        // /dongtick
        else if (commandName === 'dongtick') {
            await interaction.reply('🔒 **Ticket này sẽ được xoá sau 5 giây...**');
            setTimeout(() => {
                interaction.channel.delete().catch(err => console.error(err));
            }, 5000);
        }

        // /lenhang
        else if (commandName === 'lenhang') {
            await interaction.deferReply();

            const tester = interaction.options.getUser('tester');
            const ign = interaction.options.getString('ign');
            const mode = interaction.options.getString('mode');
            const rankEarned = interaction.options.getString('rank');
            const previousRank = interaction.options.getString('previous_rank') || 'Unranked';

            const skinUrl = `https://visage.surgeplay.com/bust/512/${encodeURIComponent(ign)}`;

            const embedResult = new EmbedBuilder()
                .setColor('#DC143C')
                .setAuthor({ name: `${ign}'s Test Results` })
                .setTitle('🏆')
                .addFields(
                    { name: 'Tester', value: `${tester}`, inline: false },
                    { name: 'Username', value: `${ign}`, inline: false },
                    { name: 'Mode', value: `${mode}`, inline: false },
                    { name: 'Previous Rank', value: `${previousRank}`, inline: false },
                    { name: 'Rank Earned', value: `${rankEarned}`, inline: false }
                )
                .setThumbnail(skinUrl);

            await interaction.editReply({ embeds: [embedResult] });
        }

        // /ban
        else if (commandName === 'ban') {
            await interaction.deferReply();

            const ign = interaction.options.getString('ign');
            const reason = interaction.options.getString('li_do');
            const targetUser = interaction.options.getUser('user');

            const skinUrl = `https://visage.surgeplay.com/bust/512/${encodeURIComponent(ign)}`;

            if (targetUser) {
                try {
                    await interaction.guild.members.ban(targetUser, { reason: reason });
                } catch (err) {
                    console.error("Lỗi khi Ban trên Discord:", err);
                }
            }

            const embedBan = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚫 BẢNG THÔNG BÁO BAN / CẤM')
                .addFields(
                    { name: '👤 Tên người chơi (IGN)', value: `**${ign}**`, inline: true },
                    { name: '🛡️ Người xử lý', value: `${interaction.user}`, inline: true },
                    { name: '📄 Lý do bị Ban', value: `\`\`\`${reason}\`\`\``, inline: false }
                )
                .setThumbnail(skinUrl)
                .setTimestamp()
                .setFooter({ text: 'Hệ thống Quản lý Tier List' });

            await interaction.editReply({ embeds: [embedBan] });
        }

        // /win
        else if (commandName === 'win') {
            await interaction.deferReply();

            const tester = interaction.options.getUser('tester');
            const mode = interaction.options.getString('mode');
            const ign = interaction.options.getString('ign');
            const score = interaction.options.getString('ti_so');

            const skinUrl = `https://visage.surgeplay.com/bust/512/${encodeURIComponent(ign)}`;

            const embedWin = new EmbedBuilder()
                .setColor('#00FF00')
                .setAuthor({ name: `${ign}'s Match Results` })
                .setTitle('⚔️ KẾT QUẢ TRẬN TEST')
                .addFields(
                    { name: '👑 Tester', value: `${tester}`, inline: true },
                    { name: '🎮 Người chơi', value: `**${ign}**`, inline: true },
                    { name: '🎯 Mode', value: `**${mode}**`, inline: true },
                    { name: '📊 Tỉ số (Score)', value: `\`\`\`${score}\`\`\``, inline: false }
                )
                .setThumbnail(skinUrl)
                .setTimestamp()
                .setFooter({ text: 'Hệ thống Quản lý Tier List' });

            await interaction.editReply({ embeds: [embedWin] });
        }
    }

    // --- XỬ LÝ NÚT BẤM (BUTTONS) ---
    if (interaction.isButton()) {
        // Nút xác minh
        if (interaction.customId === 'btn_verify') {
            let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
            if (role) {
                await interaction.member.roles.add(role);
                await interaction.reply({ content: '✅ Bạn đã xác minh thành công và nhận role!', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Hệ thống chưa thiết lập role Verified!', ephemeral: true });
            }
        }

        // Nút Join Queue
        else if (interaction.customId === 'btn_join_queue') {
            if (!queueVanilla.isOpen) {
                return await interaction.reply({ content: '❌ Hàng đợi đã đóng!', ephemeral: true });
            }
            if (queueVanilla.players.includes(interaction.user.id)) {
                return await interaction.reply({ content: '⚠️ Bạn đã có trong hàng đợi rồi!', ephemeral: true });
            }
            if (queueVanilla.players.length >= 20) {
                return await interaction.reply({ content: '❌ Hàng đợi đã đầy (20/20)!', ephemeral: true });
            }

            queueVanilla.players.push(interaction.user.id);
            if (!queueVanilla.history.includes(interaction.user.id)) {
                queueVanilla.history.push(interaction.user.id);
            }

            await interaction.update({ embeds: [buildQueueEmbed()] });
        }

        // Nút Leave Queue
        else if (interaction.customId === 'btn_leave_queue') {
            if (!queueVanilla.players.includes(interaction.user.id)) {
                return await interaction.reply({ content: '⚠️ Bạn chưa tham gia hàng đợi!', ephemeral: true });
            }

            queueVanilla.players = queueVanilla.players.filter(id => id !== interaction.user.id);
            await interaction.update({ embeds: [buildQueueEmbed()] });
        }
    }
});

client.login(TOKEN);
        
