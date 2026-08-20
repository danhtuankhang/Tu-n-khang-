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

let queueVanilla = {
    isOpen: false,
    testers: [],
    players: [],
    messageId: null,
    channelId: null,
    timer: null,
    history: []
};

const commands = [
    new SlashCommandBuilder().setName('xacminh').setDescription('Gửi bảng xác minh role').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('taorolexacminh').setDescription('Tự động tạo Role xác minh').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('queuevanilla').setDescription('Mở hàng đợi Queue Vanilla').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('queuekomo').setDescription('Đóng Queue Vanilla').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('tophopvanill').setDescription('Xem danh sách tổng hợp'),
    
    // Lệnh tạo ticket theo mode
    new SlashCommandBuilder().setName('taotick')
        .setDescription('Tạo channel ticket theo mode cho người chơi')
        .addUserOption(opt => opt.setName('player').setDescription('Người chơi').setRequired(true))
        .addStringOption(opt => opt.setName('mode').setDescription('Chế độ chơi (Mode)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // Lệnh đóng ticket theo mode (hoặc đóng kênh ticket hiện tại)
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
            const embed = new EmbedBuilder()
                .setColor('#DC143C')
                .setTitle('📝 Evaluation Testing Waitlist')
                .setDescription('Upon applying, you will be added to a waitlist channel.\nHere you will be pinged when a tester of your region is available.\nIf you are HT3 or higher, a high ticket will be created.\n\n• Region should be the region of the server you wish to test on\n• Username should be the name of the account you will be testing on\n\n🛑 **Failure to provide authentic information will result in a denied test.**');
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_open_verify_modal').setLabel('Verify Account').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_enter_waitlist').setLabel('Enter Waitlist').setStyle(ButtonStyle.Secondary)
            );
            await interaction.reply({ embeds: [embed], components: [row] });
        }
        else if (commandName === 'taorolexacminh') {
            try {
                let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
                if (!role) {
                    await interaction.guild.roles.create({ name: 'Verified', color: '#00FF00', reason: 'Tạo role xác minh' });
                }
                await interaction.reply({ content: '✅ Đã tạo/kiểm tra xong Role Verified!', ephemeral: true });
            } catch (e) {
                await interaction.reply({ content: `❌ Lỗi: ${e.message}`, ephemeral: true });
            }
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
        else if (commandName === 'taotick') {
            const player = interaction.options.getUser('player');
            const mode = interaction.options.getString('mode');
            const guild = interaction.guild;

            try {
                // Tạo channel ticket mới dạng text channel
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${player.username}-${mode}`.toLowerCase(),
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id, // Ẩn với mọi người
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: player.id, // Cho phép người chơi thấy
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: interaction.user.id, // Cho phép người tạo (tester/admin) thấy
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: client.user.id, // Bot quản lý
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`🎫 Ticket Test - Mode: ${mode}`)
                    .setDescription(`Xin chào <@${player.id}> và <@${interaction.user.id}>!\nKênh ticket này đã được tạo riêng cho chế độ **${mode}**.\nHãy trao đổi và tiến hành test tại đây.`);

                await ticketChannel.send({ content: `<@${player.id}> <@${interaction.user.id}>`, embeds: [embed] });
                await interaction.reply({ content: `✅ Đã tạo thành công ticket: <#${ticketChannel.id}>`, ephemeral: true });
            } catch (e) {
                await interaction.reply({ content: `❌ Không thể tạo ticket: ${e.message}`, ephemeral: true });
            }
        }
        else if (commandName === 'dongtick') {
            const channel = interaction.channel;
            await interaction.reply({ content: '🔒 Ticket sẽ được đóng sau 3 giây nữa...', ephemeral: true });
            setTimeout(() => {
                channel.delete().catch(() => {});
            }, 3000);
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
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            let roleToGive = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === rank.toLowerCase());
            if (roleToGive) {
                try {
                    const member = await interaction.guild.members.fetch(player.id);
                    await member.roles.add(roleToGive);
                } catch (e) {
                    console.error("Không thể cấp role rank:", e);
                }
            }
        }
        else if (commandName === 'ban' || commandName === 'win') {
            await interaction.reply({ content: '✅ Đã thực hiện lệnh thành công!', ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'btn_open_verify_modal') {
            const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verify Account & Server');
            
            const ignInput = new TextInputBuilder()
                .setCustomId('ign')
                .setLabel('In-game name (IGN)')
                .setPlaceholder('Nhập tên Minecraft của bạn')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const serverInput = new TextInputBuilder()
                .setCustomId('server_region')
                .setLabel('Server muốn test')
                .setPlaceholder('Ví dụ: NA, ASIA, EU...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const typeInput = new TextInputBuilder()
                .setCustomId('account_type')
                .setLabel('Loại tài khoản (Premium / Cracked)')
                .setPlaceholder('Nhập Premium hoặc Cracked')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(ignInput),
                new ActionRowBuilder().addComponents(serverInput),
                new ActionRowBuilder().addComponents(typeInput)
            );

            await interaction.showModal(modal);
        }
        else if (interaction.customId === 'btn_enter_waitlist') {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_mode_waitlist')
                .setPlaceholder('Chọn mode...')
                .addOptions(
                    new StringSelectMenuOptionBuilder().setLabel('Sword').setValue('Sword'),
                    new StringSelectMenuOptionBuilder().setLabel('SMP').setValue('SMP'),
                    new StringSelectMenuOptionBuilder().setLabel('Vanilla').setValue('Vanilla'),
                    new StringSelectMenuOptionBuilder().setLabel('NetheritePot').setValue('NetheritePot'),
                    new StringSelectMenuOptionBuilder().setLabel('Axe').setValue('Axe'),
                    new StringSelectMenuOptionBuilder().setLabel('Mace').setValue('Mace'),
                    new StringSelectMenuOptionBuilder().setLabel('UHC').setValue('UHC'),
                    new StringSelectMenuOptionBuilder().setLabel('DiamondPot').setValue('DiamondPot')
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.reply({ content: 'Vui lòng chọn chế độ chơi (mode) bên dưới:', components: [row], ephemeral: true });
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

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_mode_waitlist') {
            const selectedMode = interaction.values[0];
            const guild = interaction.guild;
            const member = interaction.member;

            let role = guild.roles.cache.find(r => r.name === selectedMode);
            if (!role) {
                try {
                    role = await guild.roles.create({ name: selectedMode, color: '#3498DB', reason: `Tự động tạo role mode` });
                } catch (e) { console.error(e); }
            }

            if (role) {
                try {
                    await member.roles.add(role);
                    await interaction.update({ content: `✅ Đã chọn mode **${selectedMode}** và được cấp role thành công!`, components: [] });
                } catch (e) {
                    await interaction.update({ content: `⚠️ Đã chọn **${selectedMode}**, nhưng bot thiếu quyền cấp role!`, components: [] });
                }
            }
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'verify_modal') {
            const ign = interaction.fields.getTextInputValue('ign');
            const serverRegion = interaction.fields.getTextInputValue('server_region');
            const accountType = interaction.fields.getTextInputValue('account_type');

            await interaction.reply({ 
                content: `✅ Xác minh tài khoản thành công!\n- **IGN:** ${ign}\n- **Server:** ${serverRegion}\n- **Loại tài khoản:** ${accountType}`, 
                ephemeral: true 
            });

            let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
            if (role) {
                try {
                    await interaction.member.roles.add(role);
                } catch (e) {
                    console.error("Không thể cấp role Verified:", e);
                }
            }
        }
    }
});

client.login(TOKEN);
                                                    
